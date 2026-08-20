"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  cancelAppointment,
  createAppointment,
} from "@/lib/dal/appointments";

const appointmentSchema = z.object({
  patientId: z.string().min(1),
  inicio: z.string().min(1),
  fin: z.string().min(1),
  recordarPaciente: z.boolean().optional().default(false),
});

export type AppointmentActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createAppointmentAction(input: {
  patientId: string;
  inicio: string;
  fin: string;
  recordarPaciente?: boolean;
}): Promise<AppointmentActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const appt = await createAppointment({
      patientId: parsed.data.patientId,
      inicio: new Date(parsed.data.inicio),
      fin: new Date(parsed.data.fin),
      recordarPaciente: parsed.data.recordarPaciente,
    });
    revalidatePath("/agenda");
    return { ok: true, id: appt.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear la cita",
    };
  }
}

export async function cancelAppointmentAction(
  appointmentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await cancelAppointment(appointmentId);
    revalidatePath("/agenda");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo cancelar la cita",
    };
  }
}
