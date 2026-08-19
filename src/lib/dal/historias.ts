import "server-only";

import { after } from "next/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { HistoriaClinica } from "@/lib/schemas/historia-clinica";

import { requireContext } from "./context";
import { audit } from "./audit";

export async function getHistoria(patientId: string) {
  const ctx = await requireContext();
  const historia = await prisma.historiaClinica.findFirst({
    where: {
      patientId,
      patient: {
        orgId: ctx.orgId,
        ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
      },
    },
  });
  after(() => audit(ctx, "historia.read", patientId));
  return historia;
}

export async function saveHistoria(
  patientId: string,
  datos: HistoriaClinica,
) {
  const ctx = await requireContext();
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      orgId: ctx.orgId,
      ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
    },
    select: { id: true },
  });
  if (!patient) notFound();

  const historia = await prisma.historiaClinica.upsert({
    where: { patientId: patient.id },
    create: {
      patientId: patient.id,
      datos: datos as unknown as Prisma.InputJsonValue,
    },
    update: {
      datos: datos as unknown as Prisma.InputJsonValue,
    },
  });
  await audit(ctx, "historia.save", patientId);
  return historia;
}
