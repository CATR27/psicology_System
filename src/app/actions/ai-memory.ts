"use server";

import { revalidatePath } from "next/cache";

import {
  listAiMemoryNotes,
  addAiMemoryNote,
  deleteAiMemoryNote,
} from "@/lib/dal/ai-memory";

export async function listAiMemoryNotesAction() {
  const notes = await listAiMemoryNotes();
  return notes.map((n) => ({ id: n.id, texto: n.texto, creadaEn: n.creadaEn.toISOString() }));
}

export async function addAiMemoryNoteAction(
  texto: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await addAiMemoryNote(texto);
    revalidatePath("/sesiones", "layout");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar la nota",
    };
  }
}

export async function deleteAiMemoryNoteAction(
  noteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteAiMemoryNote(noteId);
    revalidatePath("/sesiones", "layout");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo borrar la nota",
    };
  }
}
