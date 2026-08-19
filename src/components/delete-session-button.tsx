"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteSessionAction } from "@/app/actions/sessions";
import { Button } from "@/components/ui/button";

export function DeleteSessionButton({
  sessionId,
  patientId,
  label = "Borrar sesión",
}: {
  sessionId: string;
  patientId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (
      !confirm(
        "¿Borrar esta sesión? Se eliminará su registro y no se podrá recuperar.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteSessionAction(sessionId, patientId);
      if (result.ok) {
        router.push(`/pacientes/${patientId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
        disabled={pending}
      >
        {pending ? "Borrando..." : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
