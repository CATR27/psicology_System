"use server";

import { revalidatePath } from "next/cache";

import { consentSchema, type ConsentInput } from "@/lib/schemas/consent";
import { createConsent, revokeConsent } from "@/lib/dal/consents";

export type ConsentActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createConsentAction(
  input: ConsentInput,
): Promise<ConsentActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    await createConsent(parsed.data);
    revalidatePath(`/pacientes/${input.patientId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo registrar",
    };
  }
}

export async function revokeConsentAction(
  consentId: string,
  patientId: string,
): Promise<ConsentActionResult> {
  try {
    await revokeConsent(consentId);
    revalidatePath(`/pacientes/${patientId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo revocar",
    };
  }
}
