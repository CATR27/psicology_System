import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { ConsentInput } from "@/lib/schemas/consent";

import { requireContext } from "./context";
import { audit } from "./audit";

export async function hasActiveConsent(
  patientId: string,
  tipo: "GRABACION" | "TRATAMIENTO_IA",
) {
  const consent = await prisma.consent.findFirst({
    where: { patientId, tipo, revocadoEn: null },
    select: { id: true },
  });
  return consent !== null;
}

export async function createConsent(input: ConsentInput) {
  const ctx = await requireContext();
  const patient = await prisma.patient.findFirst({
    where: {
      id: input.patientId,
      orgId: ctx.orgId,
      ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
    },
    select: { id: true },
  });
  if (!patient) notFound();

  const consent = await prisma.consent.create({
    data: {
      patientId: patient.id,
      tipo: input.tipo,
      otorgadoEn: new Date(input.otorgadoEn),
      evidenciaUrl: input.evidenciaUrl ?? null,
    },
  });
  await audit(ctx, "consent.create", consent.id);
  return consent;
}

export async function revokeConsent(consentId: string) {
  const ctx = await requireContext();
  const consent = await prisma.consent.findFirst({
    where: {
      id: consentId,
      patient: {
        orgId: ctx.orgId,
        ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
      },
    },
    select: { id: true, revocadoEn: true },
  });
  if (!consent) notFound();

  const updated = await prisma.consent.update({
    where: { id: consent.id },
    data: { revocadoEn: new Date() },
  });
  await audit(ctx, "consent.revoke", consent.id);
  return updated;
}
