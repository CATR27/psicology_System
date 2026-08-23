import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createMultipartUpload,
  presignUploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from "@/lib/r2";

import { requireContext } from "./context";
import { audit } from "./audit";
import { hasActiveConsent } from "./consents";

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
  return updated;
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
