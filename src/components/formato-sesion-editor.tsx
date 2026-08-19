"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { createNoteAction, updateDraftAction } from "@/app/actions/notes";
import type { FormatoSesion } from "@/lib/schemas/formato-sesion";
import { setSessionDirty } from "@/lib/session-dirty";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CLIMA_CHIPS = [
  "Ansioso",
  "Receptivo",
  "Tranquilo",
  "Enojado",
  "Reflexivo",
  "Conmovido",
  "Defensivo",
  "Aplanado",
];

type Props = {
  sessionId: string;
  noteId?: string;
  initial?: FormatoSesion;
};

export function FormatoSesionEditor({ sessionId, noteId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, control } = useForm<FormatoSesion>({
    defaultValues: {
      objetivoSesion: initial?.objetivoSesion ?? "",
      temasCentrales: initial?.temasCentrales ?? "",
      senalamientos: initial?.senalamientos ?? "",
      climaAfectivo: initial?.climaAfectivo ?? "",
      observaciones: initial?.observaciones ?? "",
    },
  });

  const clima = useWatch({ control, name: "climaAfectivo" });
  const allValues = useWatch({ control });

  const initialKey = JSON.stringify({
    objetivoSesion: initial?.objetivoSesion ?? "",
    temasCentrales: initial?.temasCentrales ?? "",
    senalamientos: initial?.senalamientos ?? "",
    climaAfectivo: initial?.climaAfectivo ?? "",
    observaciones: initial?.observaciones ?? "",
  });

  const dirty = JSON.stringify(allValues) !== initialKey;

  useEffect(() => {
    setSessionDirty(dirty);
  }, [dirty]);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function toggleChip(chip: string) {
    const parts = clima
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.includes(chip)) {
      setValue(
        "climaAfectivo",
        parts.filter((p) => p !== chip).join(", "),
      );
    } else {
      setValue("climaAfectivo", [...parts, chip].join(", "));
    }
  }

  function onSubmit(values: FormatoSesion) {
    setError(null);
    startTransition(async () => {
      const result = noteId
        ? await updateDraftAction(noteId, sessionId, values)
        : await createNoteAction(sessionId, values);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="objetivoSesion">Objetivo de la sesión</Label>
        <Textarea
          id="objetivoSesion"
          rows={3}
          placeholder="Metas terapéuticas planificadas para esta consulta"
          {...register("objetivoSesion")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="temasCentrales">Temas centrales abordados</Label>
        <Textarea
          id="temasCentrales"
          rows={4}
          placeholder="Relato principal, problemáticas expresadas y motivos de preocupación"
          {...register("temasCentrales")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="senalamientos">
          Señalamientos, interpretaciones y sugerencias
        </Label>
        <Textarea
          id="senalamientos"
          rows={4}
          placeholder="Intervenciones, encuadres, reestructuraciones, tareas asignadas"
          {...register("senalamientos")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="climaAfectivo">Clima afectivo</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {CLIMA_CHIPS.map((c) => {
            const active = clima
              .split(",")
              .map((s) => s.trim())
              .includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggleChip(c)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        <Textarea
          id="climaAfectivo"
          rows={2}
          placeholder="Estado emocional dominante durante la consulta"
          {...register("climaAfectivo")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          rows={3}
          placeholder="Lenguaje no verbal, puntualidad, aspectos para la siguiente sesión"
          {...register("observaciones")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : noteId ? "Guardar borrador" : "Guardar sesión"}
      </Button>
    </form>
  );
}
