"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
} from "@/lib/dal/appointments";

const appointmentSchema = z.object({
  patientId: z.string().min(1),
  inicio: z.string().min(1),
  fin: z.string().min(1),
});

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  inicio: z.string().min(1),
  fin: z.string().min(1),
});

export type AppointmentActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createAppointmentAction(input: {
  patientId: string;
  inicio: string;
  fin: string;
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

export async function rescheduleAppointmentAction(input: {
  appointmentId: string;
  inicio: string;
  fin: string;
}): Promise<AppointmentActionResult> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    await rescheduleAppointment(
      parsed.data.appointmentId,
      new Date(parsed.data.inicio),
      new Date(parsed.data.fin),
    );
    revalidatePath("/agenda");
    return { ok: true, id: parsed.data.appointmentId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo reprogramar la cita",
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
