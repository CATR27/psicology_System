"use client";

import { useState, useTransition } from "react";

import {
  listAiMemoryNotesAction,
  addAiMemoryNoteAction,
  deleteAiMemoryNoteAction,
} from "@/app/actions/ai-memory";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Note = { id: string; texto: string; creadaEn: string };

export function JesiaMemory() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setOpen((o) => !o);
    if (!loaded) {
      startTransition(async () => {
        const fresh = await listAiMemoryNotesAction();
        setNotes(fresh);
        setLoaded(true);
      });
    }
  }

  function onAdd() {
    setError(null);
    const texto = draft.trim();
    if (!texto) return;
    startTransition(async () => {
      const result = await addAiMemoryNoteAction(texto);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
      const fresh = await listAiMemoryNotesAction();
      setNotes(fresh);
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteAiMemoryNoteAction(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        JesIA · {notes.length > 0 || !loaded ? "notas" : "sin notas"}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Notas para entrenar a JesIA: correcciones, tips, o cómo te
            gustaría que redacte tus resúmenes. Solo aplican a{" "}
            <strong>tus</strong> sesiones — cada psicólogo tiene las suyas.
          </p>

          {pending && !loaded ? (
            <p className="text-xs text-muted-foreground">Cargando…</p>
          ) : notes.length > 0 ? (
            <ul className="space-y-1.5">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs"
                >
                  <span>{n.texto}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(n.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    borrar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Todavía no hay notas guardadas.
            </p>
          )}

          <div className="space-y-1.5">
            <Textarea
              rows={2}
              placeholder='Ej. "Sé más breve en observaciones" o "Usa un tono más cálido"'
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="text-xs"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAdd}
              disabled={pending || !draft.trim()}
            >
              Guardar nota
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
