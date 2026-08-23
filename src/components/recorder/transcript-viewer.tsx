"use client";

import { useState, useTransition } from "react";

import { reassignSegmentSpeakerAction } from "@/app/actions/recordings";
import { seekSessionAudio } from "@/lib/audio-seek";
import { cn } from "@/lib/utils";

type Hablante = "PSICOLOGO" | "PACIENTE";

type Segment = {
  id: string;
  hablante: Hablante;
  msInicio: number;
  msFin: number;
  texto: string;
};

type Recording = {
  id: string;
  estado: string;
  duracionSeg: number | null;
  transcripts: { id: string; segments: Segment[] }[];
};

function fmtMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Grabación creada, sin subir",
  SUBIDO: "Audio subido, preparando transcripción…",
  TRANSCRIBIENDO: "Transcribiendo…",
  ANALIZANDO: "Analizando…",
  FALLIDO: "Falló la grabación o transcripción",
};

function SegmentBubble({
  segment,
  sessionId,
}: {
  segment: Segment;
  sessionId: string;
}) {
  const [hablante, setHablante] = useState(segment.hablante);
  const [pending, startTransition] = useTransition();
  const isPsicologo = hablante === "PSICOLOGO";

  function toggle() {
    const next: Hablante = isPsicologo ? "PACIENTE" : "PSICOLOGO";
    setHablante(next);
    startTransition(async () => {
      const result = await reassignSegmentSpeakerAction({
        segmentId: segment.id,
        hablante: next,
        sessionId,
      });
      if (!result.ok) setHablante(hablante);
    });
  }

  return (
    <div className={cn("flex", isPsicologo ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm space-y-1",
          isPsicologo ? "bg-muted" : "bg-primary/10",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium">
            {isPsicologo ? "Psicólogo" : "Paciente"}
          </span>
          <button
            type="button"
            onClick={() => seekSessionAudio(segment.msInicio / 1000)}
            className="underline hover:no-underline"
            title="Escuchar este momento"
          >
            {fmtMs(segment.msInicio)}–{fmtMs(segment.msFin)}
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="underline hover:no-underline disabled:opacity-50"
          >
            reasignar
          </button>
        </div>
        <p>{segment.texto}</p>
      </div>
    </div>
  );
}

export function TranscriptViewer({
  sessionId,
  recordings,
}: {
  sessionId: string;
  recordings: Recording[];
}) {
  if (recordings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay grabaciones para esta consulta.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {recordings.map((rec) => {
        const transcript = rec.transcripts[0];
        if (rec.estado !== "TRANSCRITO" || !transcript) {
          return (
            <p key={rec.id} className="text-sm text-muted-foreground">
              {ESTADO_LABEL[rec.estado] ?? rec.estado}
            </p>
          );
        }
        return (
          <div key={rec.id} className="space-y-2">
            {transcript.segments.map((seg) => (
              <SegmentBubble key={seg.id} segment={seg} sessionId={sessionId} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
