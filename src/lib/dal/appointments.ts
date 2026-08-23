import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import { requireContext } from "./context";
import { audit } from "./audit";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type ReminderTipo = "PSICOLOGO_DIA_ANTES" | "PSICOLOGO_HORA_ANTES";

export type AppointmentCreateInput = {
  patientId: string;
  inicio: Date;
  fin: Date;
};

function ownership(ctx: Awaited<ReturnType<typeof requireContext>>) {
  return ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId };
}

function buildReminderRows(params: {
  inicio: Date;
  psicologoEmail: string | null | undefined;
}): { tipo: ReminderTipo; programadoPara: Date; email: string }[] {
  const { inicio, psicologoEmail } = params;
  const reminders: { tipo: ReminderTipo; programadoPara: Date; email: string }[] = [];
  if (psicologoEmail) {
    reminders.push(
      {
        tipo: "PSICOLOGO_DIA_ANTES",
        programadoPara: new Date(inicio.getTime() - DAY),
        email: psicologoEmail,
      },
      {
        tipo: "PSICOLOGO_HORA_ANTES",
        programadoPara: new Date(inicio.getTime() - HOUR),
        email: psicologoEmail,
      },
    );
  }
  return reminders;
}

export async function createAppointment(input: AppointmentCreateInput) {
  const ctx = await requireContext();
  const patient = await prisma.patient.findFirst({
    where: {
      id: input.patientId,
      orgId: ctx.orgId,
      ...ownership(ctx),
    },
    select: { id: true },
  });
  if (!patient) notFound();

  const psicologo = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true },
  });

  const appointment = await prisma.appointment.create({
    data: {
      orgId: ctx.orgId,
      psicologoId: ctx.userId,
      patientId: patient.id,
      inicio: input.inicio,
      fin: input.fin,
    },
  });

  const reminders = buildReminderRows({
    inicio: input.inicio,
    psicologoEmail: psicologo?.email,
  });

  if (reminders.length > 0) {
    await prisma.reminder.createMany({
      data: reminders.map((r) => ({
        appointmentId: appointment.id,
        tipo: r.tipo,
        destinatarioEmail: r.email,
        programadoPara: r.programadoPara,
      })),
    });
  }

  await audit(ctx, "appointment.create", appointment.id);
  return appointment;
}

export async function rescheduleAppointment(
  appointmentId: string,
  inicio: Date,
  fin: Date,
) {
  const ctx = await requireContext();
  const appt = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      orgId: ctx.orgId,
      ...ownership(ctx),
      estado: { not: "CANCELADA" },
    },
    select: { id: true, psicologoId: true },
  });
  if (!appt) notFound();

  const psicologo = await prisma.user.findUnique({
    where: { id: appt.psicologoId },
    select: { email: true },
  });

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { inicio, fin },
  });
  await prisma.reminder.deleteMany({
    where: { appointmentId: appt.id, estado: "PENDIENTE" },
  });

  const reminders = buildReminderRows({
    inicio,
    psicologoEmail: psicologo?.email,
  });

  if (reminders.length > 0) {
    await prisma.reminder.createMany({
      data: reminders.map((r) => ({
        appointmentId: appt.id,
        tipo: r.tipo,
        destinatarioEmail: r.email,
        programadoPara: r.programadoPara,
      })),
    });
  }

  await audit(ctx, "appointment.reschedule", appointmentId);
}

export async function listAppointments() {
  const ctx = await requireContext();
  return prisma.appointment.findMany({
    where: {
      orgId: ctx.orgId,
      ...ownership(ctx),
      estado: { not: "CANCELADA" },
    },
    orderBy: { inicio: "asc" },
    include: {
      patient: { select: { id: true, nombre: true, email: true } },
    },
  });
}

export async function cancelAppointment(appointmentId: string) {
  const ctx = await requireContext();
  const appt = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      orgId: ctx.orgId,
      ...ownership(ctx),
    },
    select: { id: true },
  });
  if (!appt) notFound();

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { estado: "CANCELADA" },
  });
  await prisma.reminder.deleteMany({
    where: { appointmentId: appt.id, estado: "PENDIENTE" },
  });
  await audit(ctx, "appointment.cancel", appointmentId);
}
