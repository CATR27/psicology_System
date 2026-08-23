import "server-only";

export async function startTranscription(params: {
  audioUrl: string;
  callbackUrl: string;
}) {
  const qs = new URLSearchParams({
    model: "nova-3",
    language: "es",
    diarize: "true",
    punctuate: "true",
    smart_format: "true",
    utterances: "true",
    callback: params.callbackUrl,
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${qs.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: params.audioUrl }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Deepgram rechazó la solicitud (${res.status}): ${body}`);
  }
}
