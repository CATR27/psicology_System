export const SESSION_AUDIO_ID = "session-audio";

export function seekSessionAudio(seconds: number) {
  if (typeof document === "undefined") return;
  const audio = document.getElementById(
    SESSION_AUDIO_ID,
  ) as HTMLAudioElement | null;
  if (!audio) return;
  audio.currentTime = seconds;
  void audio.play();
  audio.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function parseTimestamp(ts: string): number {
  const cleaned = ts.replace(/[^\d:]/g, ""); // por si viene con corchetes u otro ruido
  const [m, s] = cleaned.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
