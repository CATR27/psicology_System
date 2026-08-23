import { z } from "zod";

import { startRecording } from "@/lib/dal/recordings";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  mimeType: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "sessionId requerido" }, { status: 400 });
  }

  try {
    const result = await startRecording(parsed.data.sessionId, parsed.data.mimeType);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "No se pudo iniciar la grabación" },
      { status: 400 },
    );
  }
}
