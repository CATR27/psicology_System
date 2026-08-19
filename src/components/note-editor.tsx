"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createNoteAction, updateDraftAction } from "@/app/actions/notes";
import type { SoapNote } from "@/lib/schemas/note";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormValues = {
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  temas: string;
  tareas: string;
  riesgos: string;
};

const SEVERIDADES = ["bajo", "medio", "alto", "critico"] as const;

function linesToArray(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function arrayToLines(a: string[]): string {
  return a.join("\n");
}

function riesgosToLines(r: SoapNote["riesgos"]): string {
  return r
    .map((x) => `${x.tipo}: ${x.descripcion} (${x.severidad})`)
    .join("\n");
}

function parseRiesgos(s: string): SoapNote["riesgos"] {
  return linesToArray(s).map((line) => {
    const m = line.match(/^(.*?):\s*(.*?)(?:\s*\((bajo|medio|alto|critico)\))?\s*$/i);
    if (m && m[1] && m[2]) {
      const sev = m[3]?.toLowerCase();
      return {
        tipo: m[1].trim(),
        descripcion: m[2].trim(),
        severidad:
          sev && (SEVERIDADES as readonly string[]).includes(sev)
            ? (sev as SoapNote["riesgos"][number]["severidad"])
            : "medio",
      };
    }
    return { tipo: "riesgo", descripcion: line, severidad: "medio" as const };
  });
}

type Props = {
  sessionId: string;
  noteId?: string;
  initial?: SoapNote;
};

export function NoteEditor({ sessionId, noteId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      subjetivo: initial?.subjetivo ?? "",
      objetivo: initial?.objetivo ?? "",
      analisis: initial?.analisis ?? "",
      plan: initial?.plan ?? "",
      temas: initial?.temas ? arrayToLines(initial.temas) : "",
      tareas: initial?.tareas ? arrayToLines(initial.tareas) : "",
      riesgos: initial?.riesgos ? riesgosToLines(initial.riesgos) : "",
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    const soap: SoapNote = {
      subjetivo: values.subjetivo.trim(),
      objetivo: values.objetivo.trim(),
      analisis: values.analisis.trim(),
      plan: values.plan.trim(),
      temas: linesToArray(values.temas),
      tareas: linesToArray(values.tareas),
      riesgos: parseRiesgos(values.riesgos),
    };
    startTransition(async () => {
      const result = noteId
        ? await updateDraftAction(noteId, sessionId, soap)
        : await createNoteAction(sessionId, soap);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="subjetivo">S — Subjetivo</Label>
          <Textarea
            id="subjetivo"
            rows={4}
            placeholder="Lo que el paciente reporta o expresa"
            {...register("subjetivo")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="objetivo">O — Objetivo</Label>
          <Textarea
            id="objetivo"
            rows={4}
            placeholder="Observaciones del terapeuta"
            {...register("objetivo")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analisis">A — Análisis</Label>
          <Textarea
            id="analisis"
            rows={4}
            placeholder="Evaluación e impresión clínica"
            {...register("analisis")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan">P — Plan</Label>
          <Textarea
            id="plan"
            rows={4}
            placeholder="Plan de tratamiento y próximos pasos"
            {...register("plan")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="temas">Temas principales (uno por línea)</Label>
          <Textarea id="temas" rows={3} {...register("temas")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tareas">Tareas para el paciente (una por línea)</Label>
          <Textarea id="tareas" rows={3} {...register("tareas")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="riesgos">
          Señales de riesgo — una por línea, formato:{" "}
          <span className="font-normal text-muted-foreground">
            tipo: descripción (bajo|medio|alto|critico)
          </span>
        </Label>
        <Textarea
          id="riesgos"
          rows={2}
          placeholder="Ej: ideación suicida: mencionó pensamientos (alto)"
          {...register("riesgos")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : noteId ? "Guardar borrador" : "Crear nota"}
      </Button>
    </form>
  );
}
