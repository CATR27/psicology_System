import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createMultipartUpload,
  presignUploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
  presignGetObject,
} from "@/lib/r2";
import { startTranscription } from "@/lib/deepgram";
import { generateFormatoSesion } from "@/lib/ai/gemini";

import { requireContext } from "./context";
import { audit } from "./audit";
import { hasActiveConsent } from "./consents";
import { listAiMemoryTextsFor } from "./ai-memory";

type Hablante = "PSICOLOGO" | "PACIENTE";

function sessionScope(ctx: Awaited<ReturnType<typeof requireContext>>) {
  return {
    patient: {
      orgId: ctx.orgId,
      ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
    },
  };
}

async function getOwnedSession(
  ctx: Awaited<ReturnType<typeof requireContext>>,
  sessionId: string,
) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, ...sessionScope(ctx) },
    select: { id: true, patientId: true },
  });
  if (!session) notFound();
  return session;
}

async function getOwnedRecording(
  ctx: Awaited<ReturnType<typeof requireContext>>,
  recordingId: string,
) {
  const recording = await prisma.recording.findFirst({
    where: { id: recordingId, session: sessionScope(ctx) },
  });
  if (!recording) notFound();
  return recording;
}

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

export async function startRecording(sessionId: string, mimeType?: string) {
  const ctx = await requireContext();
  const session = await getOwnedSession(ctx, sessionId);

  const consentida = await hasActiveConsent(session.patientId, "GRABACION");
  if (!consentida) {
    throw new Error(
      "El paciente no tiene consentimiento de grabación vigente.",
    );
  }

  const contentType = mimeType?.split(";")[0] || "audio/webm";
  const ext = EXT_BY_MIME[contentType] ?? "webm";

  const recording = await prisma.recording.create({
    data: { sessionId: session.id, estado: "PENDIENTE" },
  });

  const r2Key = `sessions/${session.id}/${recording.id}.${ext}`;
  const uploadId = await createMultipartUpload(r2Key, contentType);

  const updated = await prisma.recording.update({
    where: { id: recording.id },
    data: { r2Key, uploadId },
  });

  await audit(ctx, "recording.start", recording.id);
  return { recordingId: updated.id };
}

export async function getUploadPartUrl(recordingId: string, partNumber: number) {
  const ctx = await requireContext();
  const recording = await getOwnedRecording(ctx, recordingId);
  if (!recording.r2Key || !recording.uploadId) {
    throw new Error("La grabación no tiene una subida multipart activa.");
  }
  const url = await presignUploadPart(recording.r2Key, recording.uploadId, partNumber);
  return { url };
}

export async function completeRecording(
  recordingId: string,
  parts: { partNumber: number; etag: string }[],
  durationSec: number,
  bytes: number,
) {
  const ctx = await requireContext();
  const recording = await getOwnedRecording(ctx, recordingId);
  if (!recording.r2Key || !recording.uploadId) {
    throw new Error("La grabación no tiene una subida multipart activa.");
  }

  await completeMultipartUpload(recording.r2Key, recording.uploadId, parts);

  const updated = await prisma.recording.update({
    where: { id: recording.id },
    data: {
      estado: "SUBIDO",
      duracionSeg: durationSec,
      bytes,
    },
  });

  await audit(ctx, "recording.complete", recording.id);

  try {
    const audioUrl = await presignGetObject(recording.r2Key);
    const callbackUrl = `${process.env.APP_URL}/api/webhooks/deepgram?token=${process.env.WEBHOOK_SECRET}&recordingId=${recording.id}`;
    await startTranscription({ audioUrl, callbackUrl });
    await prisma.recording.update({
      where: { id: recording.id },
      data: { estado: "TRANSCRIBIENDO" },
    });
  } catch (e) {
    // No tumbamos la respuesta de "subida completa" por un hiccup de Deepgram.
    // Se queda en SUBIDO; el barredor de reintentos (pendiente) lo recoge.
    console.error(
      "Error disparando transcripción",
      e instanceof Error ? e.message : e,
    );
  }

  return updated;
}

export async function saveTranscript(recordingId: string, dgResult: unknown) {
  const recording = await prisma.recording.findUnique({
    where: { id: recordingId },
  });
  if (!recording) return; // callback de un recordingId desconocido/borrado, ignorar

  const data = dgResult as {
    results?: {
      channels?: { alternatives?: { transcript?: string; confidence?: number }[] }[];
      utterances?: {
        start: number;
        end: number;
        transcript: string;
        speaker?: number;
        words?: { speaker?: number }[];
      }[];
    };
  };

  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  const utterances = data.results?.utterances ?? [];

  const speakerMap = new Map<number, Hablante>();
  function hablanteFor(speaker: number | undefined): Hablante {
    const s = speaker ?? 0;
    if (!speakerMap.has(s)) {
      speakerMap.set(s, speakerMap.size === 0 ? "PSICOLOGO" : "PACIENTE");
    }
    return speakerMap.get(s)!;
  }

  const transcript = await prisma.transcript.create({
    data: {
      recordingId: recording.id,
      proveedor: "deepgram",
      idioma: "es",
      textoCompleto: alt?.transcript ?? "",
      confianza: alt?.confidence ?? null,
    },
  });

  if (utterances.length > 0) {
    await prisma.transcriptSegment.createMany({
      data: utterances.map((u) => ({
        transcriptId: transcript.id,
        hablante: hablanteFor(u.speaker ?? u.words?.[0]?.speaker),
        msInicio: Math.round(u.start * 1000),
        msFin: Math.round(u.end * 1000),
        texto: u.transcript,
      })),
    });
  }

  await prisma.recording.update({
    where: { id: recording.id },
    data: { estado: "TRANSCRITO" },
  });
}

export async function generateNoteFromTranscript(sessionId: string) {
  const ctx = await requireContext();
  const session = await prisma.session.findFirst({
    where: { id: sessionId, ...sessionScope(ctx) },
    select: { id: true, psicologoId: true },
  });
  if (!session) notFound();

  const recordings = await prisma.recording.findMany({
    where: { sessionId, estado: "TRANSCRITO" },
    orderBy: { creadaEn: "asc" },
    include: {
      transcripts: {
        orderBy: { creadaEn: "desc" },
        take: 1,
        include: { segments: { orderBy: { msInicio: "asc" } } },
      },
    },
  });

  const segments = recordings.flatMap((r) => r.transcripts[0]?.segments ?? []);
  if (segments.length === 0) {
    throw new Error("No hay transcripción disponible todavía.");
  }

  const lines = segments.map(
    (s) => `${s.hablante === "PSICOLOGO" ? "Psicólogo" : "Paciente"}: ${s.texto}`,
  );
  const memoryNotes = await listAiMemoryTextsFor(session.psicologoId);
  const contenido = await generateFormatoSesion(lines.join("\n"), memoryNotes);
  await audit(ctx, "note.generateAi", sessionId);
  return contenido;
}

export async function listSessionRecordings(sessionId: string) {
  const ctx = await requireContext();
  await getOwnedSession(ctx, sessionId);

  return prisma.recording.findMany({
    where: { sessionId },
    orderBy: { creadaEn: "asc" },
    include: {
      transcripts: {
        orderBy: { creadaEn: "desc" },
        take: 1,
        include: { segments: { orderBy: { msInicio: "asc" } } },
      },
    },
  });
}

export async function reassignSegmentSpeaker(
  segmentId: string,
  hablante: Hablante,
) {
  const ctx = await requireContext();
  const segment = await prisma.transcriptSegment.findFirst({
    where: {
      id: segmentId,
      transcript: { recording: { session: sessionScope(ctx) } },
    },
    select: { id: true },
  });
  if (!segment) notFound();

  await prisma.transcriptSegment.update({
    where: { id: segment.id },
    data: { hablante },
  });
  await audit(ctx, "transcriptSegment.reassign", segment.id);
}

const STUCK_AFTER_MS = 30 * 60 * 1000;
const MAX_INTENTOS = 5;

export async function sweepStuckRecordings() {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
  const stuck = await prisma.recording.findMany({
    where: {
      estado: { in: ["SUBIDO", "TRANSCRIBIENDO"] },
      actualizadaEn: { lte: cutoff },
    },
  });

  let reintentados = 0;
  for (const r of stuck) {
    if (r.intentos >= MAX_INTENTOS || !r.r2Key) {
      await prisma.recording.update({
        where: { id: r.id },
        data: { estado: "FALLIDO" },
      });
      continue;
    }

    try {
      const audioUrl = await presignGetObject(r.r2Key);
      const callbackUrl = `${process.env.APP_URL}/api/webhooks/deepgram?token=${process.env.WEBHOOK_SECRET}&recordingId=${r.id}`;
      await startTranscription({ audioUrl, callbackUrl });
      await prisma.recording.update({
        where: { id: r.id },
        data: { estado: "TRANSCRIBIENDO", intentos: { increment: 1 } },
      });
      reintentados++;
    } catch (e) {
      await prisma.recording.update({
        where: { id: r.id },
        data: { intentos: { increment: 1 } },
      });
      console.error(
        "Reintento de transcripción falló",
        r.id,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { revisados: stuck.length, reintentados };
}

export async function abortRecording(recordingId: string) {
  const ctx = await requireContext();
  const recording = await getOwnedRecording(ctx, recordingId);

  if (recording.r2Key && recording.uploadId) {
    await abortMultipartUpload(recording.r2Key, recording.uploadId);
  }

  await prisma.recording.update({
    where: { id: recording.id },
    data: { estado: "FALLIDO" },
  });

  await audit(ctx, "recording.abort", recording.id);
}
