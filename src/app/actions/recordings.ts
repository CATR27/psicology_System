"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  reassignSegmentSpeaker,
  listSessionRecordings,
  generateNoteFromTranscript,
  reviseNoteWithCorrection,
  getPlaybackUrls,
} from "@/lib/dal/recordings";
import type {
  FormatoSesion,
  FormatoSesionRevisableFields,
} from "@/lib/schemas/formato-sesion";

const reassignSchema = z.object({
  segmentId: z.string().min(1),
  hablante: z.enum(["PSICOLOGO", "PACIENTE"]),
  sessionId: z.string().min(1),
});

const revisableFieldsSchema = z.object({
  objetivoSesion: z.string(),
  temasCentrales: z.string(),
  senalamientos: z.string(),
  climaAfectivo: z.string(),
  observaciones: z.string(),
  senalesRiesgo: z.array(z.string()),
});

const reviseCorrectionSchema = z.object({
  sessionId: z.string().min(1),
  timestamp: z.string().min(1),
  oldText: z.string().min(1),
  newText: z.string().min(1),
  current: revisableFieldsSchema,
});

export async function getSessionRecordingsAction(sessionId: string) {
  return listSessionRecordings(sessionId);
}

export async function getPlaybackUrlsAction(sessionId: string) {
  return getPlaybackUrls(sessionId);
}

export async function generateNoteFromTranscriptAction(
  sessionId: string,
): Promise<{ ok: true; contenido: FormatoSesion } | { ok: false; error: string }> {
  try {
    const contenido = await generateNoteFromTranscript(sessionId);
    return { ok: true, contenido };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo generar con IA",
    };
  }
}

export async function reviseNoteWithCorrectionAction(input: {
  sessionId: string;
  timestamp: string;
  oldText: string;
  newText: string;
  current: FormatoSesionRevisableFields;
}): Promise<
  | { ok: true; revised: Partial<FormatoSesionRevisableFields> }
  | { ok: false; error: string }
> {
  const parsed = reviseCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }
  try {
    const revised = await reviseNoteWithCorrection(
      parsed.data.sessionId,
      {
        timestamp: parsed.data.timestamp,
        oldText: parsed.data.oldText,
        newText: parsed.data.newText,
      },
      parsed.data.current,
    );
    return { ok: true, revised };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "No se pudo revisar la nota con la corrección",
    };
  }
}

export async function reassignSegmentSpeakerAction(input: {
  segmentId: string;
  hablante: "PSICOLOGO" | "PACIENTE";
  sessionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }
  try {
    await reassignSegmentSpeaker(parsed.data.segmentId, parsed.data.hablante);
    revalidatePath(`/sesiones/${parsed.data.sessionId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo reasignar el hablante",
    };
  }
}
