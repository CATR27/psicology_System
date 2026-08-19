import "server-only";

import { after } from "next/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { PatientInput } from "@/lib/schemas/patient";

import { requireContext } from "./context";
import { audit } from "./audit";

function ownership(ctx: Awaited<ReturnType<typeof requireContext>>) {
  return ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId };
}

export async function listPatients() {
  const ctx = await requireContext();
  return prisma.patient.findMany({
    where: { orgId: ctx.orgId, ...ownership(ctx) },
    orderBy: { creadaEn: "desc" },
    include: { psicologo: { select: { nombre: true } } },
  });
}

export async function getPatient(patientId: string) {
  const ctx = await requireContext();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, orgId: ctx.orgId, ...ownership(ctx) },
    include: {
      psicologo: { select: { nombre: true, cedulaProfesional: true } },
      consents: { orderBy: { otorgadoEn: "desc" } },
    },
  });
  if (!patient) notFound();
  after(() => audit(ctx, "patient.read", patientId));
  return patient;
}

export async function createPatient(input: PatientInput) {
  const ctx = await requireContext();
  const patient = await prisma.patient.create({
    data: {
      orgId: ctx.orgId,
      psicologoId: ctx.userId,
      nombre: input.nombre,
      fechaNacimiento: input.fechaNacimiento
        ? new Date(input.fechaNacimiento)
        : null,
      contacto: input.contacto ?? null,
    },
  });
  await audit(ctx, "patient.create", patient.id);
  return patient;
}

export async function updatePatient(patientId: string, input: PatientInput) {
  const ctx = await requireContext();
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, orgId: ctx.orgId, ...ownership(ctx) },
    select: { id: true },
  });
  if (!existing) notFound();
  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: {
      nombre: input.nombre,
      fechaNacimiento: input.fechaNacimiento
        ? new Date(input.fechaNacimiento)
        : null,
      contacto: input.contacto ?? null,
    },
  });
  await audit(ctx, "patient.update", patient.id);
  return patient;
}
