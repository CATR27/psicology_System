"use server";

import { revalidatePath } from "next/cache";

import { patientSchema, type PatientInput } from "@/lib/schemas/patient";
import { createPatient, updatePatient } from "@/lib/dal/patients";

export type PatientActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPatientAction(
  input: PatientInput,
): Promise<PatientActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const patient = await createPatient(parsed.data);
    revalidatePath("/pacientes");
    return { ok: true, id: patient.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear el paciente",
    };
  }
}

export async function updatePatientAction(
  patientId: string,
  input: PatientInput,
): Promise<PatientActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const patient = await updatePatient(patientId, parsed.data);
    revalidatePath(`/pacientes/${patientId}`);
    revalidatePath("/pacientes");
    return { ok: true, id: patient.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo actualizar",
    };
  }
}
