"use server";

import { revalidatePath } from "next/cache";

import { sessionCreateSchema, type SessionCreateInput } from "@/lib/schemas/session";
import { createSession, deleteSession } from "@/lib/dal/sessions";

export type SessionActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createSessionAction(
  input: SessionCreateInput,
): Promise<SessionActionResult> {
  const parsed = sessionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const session = await createSession(parsed.data);
    revalidatePath(`/pacientes/${input.patientId}`);
    return { ok: true, id: session.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear la sesión",
    };
  }
}

export async function deleteSessionAction(
  sessionId: string,
  patientId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteSession(sessionId);
    revalidatePath(`/pacientes/${patientId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo borrar la sesión",
    };
  }
}
