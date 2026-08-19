import "server-only";

import { after } from "next/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { SessionCreateInput } from "@/lib/schemas/session";

import { requireContext } from "./context";
import { audit } from "./audit";

function patientScope(ctx: Awaited<ReturnType<typeof requireContext>>) {
  return {
    patient: {
      orgId: ctx.orgId,
      ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
    },
  };
}

export async function listSessions(patientId: string) {
  const ctx = await requireContext();
  const sessions = await prisma.session.findMany({
    where: { patientId, ...patientScope(ctx) },
    orderBy: { numeroSesion: "asc" },
    include: {
      clinicalNotes: {
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true, version: true, estado: true },
      },
    },
  });
  return sessions;
}

export async function getSession(sessionId: string) {
  const ctx = await requireContext();
  const session = await prisma.session.findFirst({
    where: { id: sessionId, ...patientScope(ctx) },
    include: {
      patient: { select: { id: true, nombre: true } },
      clinicalNotes: { orderBy: { version: "desc" } },
    },
  });
  if (!session) notFound();
  after(() => audit(ctx, "session.read", sessionId));
  return session;
}

export async function createSession(input: SessionCreateInput) {
  const ctx = await requireContext();
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, orgId: ctx.orgId, ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }) },
    select: { id: true },
  });
  if (!patient) notFound();

  const last = await prisma.session.findFirst({
    where: { patientId: patient.id },
    orderBy: { numeroSesion: "desc" },
    select: { numeroSesion: true },
  });

  const session = await prisma.session.create({
    data: {
      patientId: patient.id,
      psicologoId: ctx.userId,
      numeroSesion: (last?.numeroSesion ?? 0) + 1,
      iniciadaEn: input.iniciadaEn ? new Date(input.iniciadaEn) : new Date(),
    },
  });
  await audit(ctx, "session.create", session.id);
  return session;
}
