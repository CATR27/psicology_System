"use server";

import { revalidatePath } from "next/cache";

import { soapNoteSchema, type SoapNote } from "@/lib/schemas/note";
import { createNote, signNote, updateDraft } from "@/lib/dal/notes";

export type NoteActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createNoteAction(
  sessionId: string,
  soap: SoapNote,
): Promise<NoteActionResult> {
  const parsed = soapNoteSchema.safeParse(soap);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const note = await createNote(sessionId, parsed.data);
    revalidatePath(`/sesiones/${sessionId}`);
    return { ok: true, id: note.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar la nota",
    };
  }
}

export async function updateDraftAction(
  noteId: string,
  sessionId: string,
  soap: SoapNote,
): Promise<NoteActionResult> {
  const parsed = soapNoteSchema.safeParse(soap);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    const note = await updateDraft(noteId, parsed.data);
    revalidatePath(`/sesiones/${sessionId}`);
    return { ok: true, id: note.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar la nota",
    };
  }
}

export async function signNoteAction(
  noteId: string,
  sessionId: string,
): Promise<NoteActionResult> {
  try {
    const note = await signNote(noteId);
    revalidatePath(`/sesiones/${sessionId}`);
    return { ok: true, id: note.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo firmar la nota",
    };
  }
}
