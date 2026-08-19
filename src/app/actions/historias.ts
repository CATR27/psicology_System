"use server";

import { revalidatePath } from "next/cache";

import type { HistoriaClinica } from "@/lib/schemas/historia-clinica";
import { saveHistoria } from "@/lib/dal/historias";

export type HistoriaActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveHistoriaAction(
  patientId: string,
  datos: HistoriaClinica,
): Promise<HistoriaActionResult> {
  if (!datos || typeof datos !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }
  try {
    await saveHistoria(patientId, datos);
    revalidatePath(`/pacientes/${patientId}/historia`);
    revalidatePath(`/pacientes/${patientId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar",
    };
  }
}
