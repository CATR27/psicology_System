"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signNoteAction } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";

export function SignNoteButton({
  noteId,
  sessionId,
}: {
  noteId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSign() {
    if (!confirm("¿Firmar esta nota? Una nota firmada no se puede modificar.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await signNoteAction(noteId, sessionId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={onSign} disabled={pending}>
        {pending ? "Firmando..." : "Firmar nota"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
