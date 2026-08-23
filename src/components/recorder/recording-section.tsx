"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSessionRecordingsAction,
  getPlaybackUrlsAction,
} from "@/app/actions/recordings";
import { SESSION_AUDIO_ID } from "@/lib/audio-seek";
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

type PlaybackUrl = { recordingId: string; url: string; duracionSeg: number | null };

export function RecordingSection({
  sessionId,
  hasConsent,
  initialRecordings,
  initialPlaybackUrls,
}: {
  sessionId: string;
  hasConsent: boolean;
  initialRecordings: Recording[];
  initialPlaybackUrls: PlaybackUrl[];
}) {
  const router = useRouter();
  const [recordings, setRecordings] = useState(initialRecordings);
  const [playbackUrls, setPlaybackUrls] = useState(initialPlaybackUrls);
  const [polling, setPolling] = useState(
    initialRecordings.some((r) => ACTIVE_ESTADOS.has(r.estado)),
  );

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      const fresh = await getSessionRecordingsAction(sessionId);
      setRecordings(fresh);
      const stillActive = fresh.some((r) => ACTIVE_ESTADOS.has(r.estado));
      // router.refresh() también recoge la nota que la IA pudo haber
      // generado al terminar de transcribir (vive fuera de este componente).
      router.refresh();
      if (!stillActive) setPolling(false);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [polling, sessionId, router]);

  useEffect(() => {
    const transcritoIds = recordings
      .filter((r) => r.estado === "TRANSCRITO")
      .map((r) => r.id)
      .sort()
      .join(",");
    const haveIds = playbackUrls
      .map((p) => p.recordingId)
      .sort()
      .join(",");
    if (transcritoIds !== haveIds && transcritoIds !== "") {
      getPlaybackUrlsAction(sessionId).then(setPlaybackUrls);
    }
    // Solo nos importa cuándo cambia el conjunto de grabaciones transcritas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordings]);

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

      {playbackUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audio de la sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playbackUrls.map((p, i) => (
              <audio
                key={p.recordingId}
                id={i === 0 ? SESSION_AUDIO_ID : undefined}
                controls
                preload="none"
                src={p.url}
                className="w-full"
              />
            ))}
          </CardContent>
        </Card>
      )}

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
