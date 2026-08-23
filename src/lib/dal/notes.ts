import "server-only";

import { after } from "next/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { FormatoSesion } from "@/lib/schemas/formato-sesion";

import { requireContext } from "./context";
import { audit } from "./audit";

function sessionScope(ctx: Awaited<ReturnType<typeof requireContext>>) {
  return {
    session: {
      patient: {
        orgId: ctx.orgId,
        ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
      },
    },
  };
}

function asJson(contenido: FormatoSesion): Prisma.InputJsonValue {
  return contenido as unknown as Prisma.InputJsonValue;
}

export async function listNoteVersions(sessionId: string) {
  const ctx = await requireContext();
  const notes = await prisma.clinicalNote.findMany({
    where: { sessionId, ...sessionScope(ctx) },
    orderBy: { version: "desc" },
    include: { firmante: { select: { nombre: true } } },
  });
  after(() => audit(ctx, "note.read", sessionId));
  return notes;
}

export async function getLatestNote(sessionId: string) {
  const ctx = await requireContext();
  const note = await prisma.clinicalNote.findFirst({
    where: { sessionId, ...sessionScope(ctx) },
    orderBy: { version: "desc" },
    include: { firmante: { select: { nombre: true } } },
  });
  return note;
}

export async function createNote(
  sessionId: string,
  contenido: FormatoSesion,
  generadaPorIa = false,
) {
  const ctx = await requireContext();
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      patient: {
        orgId: ctx.orgId,
        ...(ctx.rol === "ADMIN" ? {} : { psicologoId: ctx.userId }),
      },
    },
    select: { id: true },
  });
  if (!session) notFound();

  const last = await prisma.clinicalNote.findFirst({
    where: { sessionId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const note = await prisma.clinicalNote.create({
    data: {
      sessionId: session.id,
      version: (last?.version ?? 0) + 1,
      estado: "BORRADOR",
      contenidoJson: asJson(contenido),
      generadaPorIa,
      editadaPorId: ctx.userId,
    },
  });
  await audit(ctx, "note.create", note.id);
  return note;
}

export async function createAiGeneratedNote(
  sessionId: string,
  contenido: FormatoSesion,
) {
  const existing = await prisma.clinicalNote.findFirst({
    where: { sessionId },
    select: { id: true },
  });
  if (existing) return null; // ya hay una nota (manual o previa) — no la pisamos

  return prisma.clinicalNote.create({
    data: {
      sessionId,
      version: 1,
      estado: "BORRADOR",
      contenidoJson: asJson(contenido),
      generadaPorIa: true,
    },
  });
}

export async function updateDraft(noteId: string, contenido: FormatoSesion) {
  const ctx = await requireContext();
  const note = await prisma.clinicalNote.findFirst({
    where: { id: noteId, ...sessionScope(ctx) },
    select: { id: true, estado: true },
  });
  if (!note) notFound();
  if (note.estado !== "BORRADOR") {
    throw new Error("Solo se puede editar una nota en borrador");
  }
  const updated = await prisma.clinicalNote.update({
    where: { id: note.id },
    data: {
      contenidoJson: asJson(contenido),
      editadaPorId: ctx.userId,
    },
  });
  await audit(ctx, "note.update", note.id);
  return updated;
}

export async function signNote(noteId: string) {
  const ctx = await requireContext();
  const note = await prisma.clinicalNote.findFirst({
    where: { id: noteId, ...sessionScope(ctx) },
    select: { id: true, estado: true },
  });
  if (!note) notFound();
  if (note.estado !== "BORRADOR") {
    throw new Error("La nota ya está firmada");
  }
  const signed = await prisma.clinicalNote.update({
    where: { id: note.id },
    data: { estado: "FIRMADA", firmadaEn: new Date(), firmadaPorId: ctx.userId },
  });
  await audit(ctx, "note.sign", note.id);
  return signed;
}
