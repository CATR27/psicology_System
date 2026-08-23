import "server-only";

import { prisma } from "@/lib/prisma";

import { requireContext } from "./context";
import { audit } from "./audit";

export async function listAiMemoryNotes() {
  const ctx = await requireContext();
  return prisma.aiMemoryNote.findMany({
    where: { psicologoId: ctx.userId },
    orderBy: { creadaEn: "desc" },
  });
}

export async function addAiMemoryNote(texto: string) {
  const ctx = await requireContext();
  const limpio = texto.trim();
  if (!limpio) throw new Error("La nota no puede estar vacía");

  const note = await prisma.aiMemoryNote.create({
    data: { psicologoId: ctx.userId, texto: limpio },
  });
  await audit(ctx, "aiMemoryNote.create", note.id);
  return note;
}

export async function deleteAiMemoryNote(noteId: string) {
  const ctx = await requireContext();
  const note = await prisma.aiMemoryNote.findFirst({
    where: { id: noteId, psicologoId: ctx.userId },
    select: { id: true },
  });
  if (!note) return;

  await prisma.aiMemoryNote.delete({ where: { id: note.id } });
  await audit(ctx, "aiMemoryNote.delete", note.id);
}

export async function listAiMemoryTextsFor(psicologoId: string): Promise<string[]> {
  const notes = await prisma.aiMemoryNote.findMany({
    where: { psicologoId },
    orderBy: { creadaEn: "asc" },
    select: { texto: true },
  });
  return notes.map((n) => n.texto);
}
