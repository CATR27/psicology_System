"use client";

import { useEffect, useState } from "react";

import { getSessionRecordingsAction } from "@/app/actions/recordings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioRecorder } from "./audio-recorder";
import { TranscriptViewer } from "./transcript-viewer";

type Segment = {
  id: string;
  hablante: "PSICOLOGO" | "PACIENTE";
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

const ACTIVE_ESTADOS = new Set([
  "PENDIENTE",
  "SUBIDO",
  "TRANSCRIBIENDO",
  "ANALIZANDO",
]);

const POLL_MS = 4000;

export function RecordingSection({
  sessionId,
  hasConsent,
  initialRecordings,
}: {
  sessionId: string;
  hasConsent: boolean;
  initialRecordings: Recording[];
}) {
  const [recordings, setRecordings] = useState(initialRecordings);
  const [polling, setPolling] = useState(
    initialRecordings.some((r) => ACTIVE_ESTADOS.has(r.estado)),
  );

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      const fresh = await getSessionRecordingsAction(sessionId);
      setRecordings(fresh);
      if (!fresh.some((r) => ACTIVE_ESTADOS.has(r.estado))) {
        setPolling(false);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [polling, sessionId]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Grabación de audio</CardTitle>
        </CardHeader>
        <CardContent>
          <AudioRecorder
            sessionId={sessionId}
            hasConsent={hasConsent}
            onUploaded={() => setPolling(true)}
          />
        </CardContent>
      </Card>

      {recordings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transcripción</CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptViewer sessionId={sessionId} recordings={recordings} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
