import { z } from "zod";

import { completeRecording } from "@/lib/dal/recordings";

export const runtime = "nodejs";

const bodySchema = z.object({
  parts: z.array(
    z.object({ partNumber: z.number().int().min(1), etag: z.string().min(1) }),
  ).min(1),
  durationSec: z.number().min(0),
  bytes: z.number().min(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const recording = await completeRecording(
      id,
      parsed.data.parts,
      parsed.data.durationSec,
      parsed.data.bytes,
    );
    return Response.json({ ok: true, recordingId: recording.id });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "No se pudo completar la subida" },
      { status: 400 },
    );
  }
}
