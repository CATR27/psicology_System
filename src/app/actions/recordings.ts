"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { reassignSegmentSpeaker, listSessionRecordings } from "@/lib/dal/recordings";

const reassignSchema = z.object({
  segmentId: z.string().min(1),
  hablante: z.enum(["PSICOLOGO", "PACIENTE"]),
  sessionId: z.string().min(1),
});

export async function getSessionRecordingsAction(sessionId: string) {
  return listSessionRecordings(sessionId);
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
