import { saveTranscript } from "@/lib/dal/recordings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const recordingId = url.searchParams.get("recordingId");

  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!recordingId) {
    return new Response("Falta recordingId", { status: 400 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return new Response("Body inválido", { status: 400 });
  }

  await saveTranscript(recordingId, payload);
  return Response.json({ ok: true });
}
