"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const MIN_PART_BYTES = 5 * 1024 * 1024; // S3/R2 exige 5MB mínimo por parte, salvo la última
const CHUNK_TIMESLICE_MS = 10_000;

type Status = "idle" | "recording" | "paused" | "uploading" | "done" | "error";

function pickMimeType(): string {
  return (
    MIME_CANDIDATES.find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
    ) ?? ""
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioRecorder({
  sessionId,
  hasConsent,
  onUploaded,
}: {
  sessionId: string;
  hasConsent: boolean;
  onUploaded?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordingIdRef = useRef<string | null>(null);
  const bufferRef = useRef<Blob[]>([]);
  const bufferBytesRef = useRef(0);
  const totalBytesRef = useRef(0);
  const partNumberRef = useRef(1);
  const partsRef = useRef<{ partNumber: number; etag: string }[]>([]);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mimeTypeRef = useRef("");

  function stopLevelMeter() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  function startLevelMeter(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = ctx;

    const data = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setLevel(Math.min(1, avg / 128));
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  function queueUpload(blob: Blob, partNumber: number) {
    uploadQueueRef.current = uploadQueueRef.current.then(async () => {
      const recordingId = recordingIdRef.current;
      if (!recordingId) return;
      const res = await fetch(`/api/recordings/${recordingId}/part-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partNumber }),
      });
      if (!res.ok) throw new Error("No se pudo generar la URL de subida");
      const { url } = await res.json();

      const put = await fetch(url, { method: "PUT", body: blob });
      if (!put.ok) throw new Error(`Falló la subida de la parte ${partNumber}`);
      const etag = put.headers.get("etag");
      if (!etag) throw new Error("R2 no devolvió ETag");
      partsRef.current.push({ partNumber, etag });
    });
  }

  function flushBuffer(force: boolean) {
    if (bufferRef.current.length === 0) return;
    if (!force && bufferBytesRef.current < MIN_PART_BYTES) return;

    const blob = new Blob(bufferRef.current, { type: mimeTypeRef.current });
    bufferRef.current = [];
    bufferBytesRef.current = 0;

    const partNumber = partNumberRef.current++;
    queueUpload(blob, partNumber);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;

      const res = await fetch("/api/recordings/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, mimeType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo iniciar la grabación");
      }
      const { recordingId } = await res.json();
      recordingIdRef.current = recordingId;

      bufferRef.current = [];
      bufferBytesRef.current = 0;
      totalBytesRef.current = 0;
      partNumberRef.current = 1;
      partsRef.current = [];
      uploadQueueRef.current = Promise.resolve();

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size === 0) return;
        bufferRef.current.push(e.data);
        bufferBytesRef.current += e.data.size;
        totalBytesRef.current += e.data.size;
        flushBuffer(false);
      };

      recorder.start(CHUNK_TIMESLICE_MS);
      startLevelMeter(stream);

      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setStatus("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la grabación");
      setStatus("error");
    }
  }

  function pause() {
    recorderRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("paused");
  }

  function resume() {
    recorderRef.current?.resume();
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    setStatus("recording");
  }

  async function stop() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    setStatus("uploading");
    if (timerRef.current) clearInterval(timerRef.current);
    stopLevelMeter();

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());

    flushBuffer(true);
    await uploadQueueRef.current;

    try {
      const recordingId = recordingIdRef.current;
      if (!recordingId) throw new Error("Grabación sin id");
      const parts = partsRef.current.sort((a, b) => a.partNumber - b.partNumber);
      if (parts.length === 0) throw new Error("No se subió ningún audio");

      const res = await fetch(`/api/recordings/${recordingId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parts,
          durationSec: elapsed,
          bytes: totalBytesRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo completar la subida");
      }
      setStatus("done");
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la subida");
      setStatus("error");
    }
  }

  if (!hasConsent) {
    return (
      <p className="text-sm text-muted-foreground">
        El paciente no tiene consentimiento de grabación vigente. Registralo
        en su ficha antes de grabar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {status === "idle" && (
        <Button onClick={start}>Iniciar grabación</Button>
      )}

      {(status === "recording" || status === "paused") && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg tabular-nums">
              {formatTime(elapsed)}
            </span>
            {status === "recording" && (
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            )}
            {status === "paused" && (
              <span className="text-xs text-muted-foreground">Pausado</span>
            )}
          </div>
          <div className="h-2 w-full max-w-xs rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-100"
              style={{ width: `${level * 100}%` }}
            />
          </div>
          <div className="flex gap-2">
            {status === "recording" ? (
              <Button variant="outline" size="sm" onClick={pause}>
                Pausar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={resume}>
                Reanudar
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={stop}>
              Detener y subir
            </Button>
          </div>
        </div>
      )}

      {status === "uploading" && (
        <p className="text-sm text-muted-foreground">Subiendo audio…</p>
      )}

      {status === "done" && (
        <p className="text-sm text-emerald-600">
          Grabación subida ({formatTime(elapsed)}). Transcripción pendiente.
        </p>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={start}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
