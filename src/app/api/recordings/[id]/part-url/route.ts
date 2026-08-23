import { z } from "zod";

import { getUploadPartUrl } from "@/lib/dal/recordings";

export const runtime = "nodejs";

const bodySchema = z.object({ partNumber: z.number().int().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "partNumber requerido" }, { status: 400 });
  }

  try {
    const result = await getUploadPartUrl(id, parsed.data.partNumber);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "No se pudo generar la URL" },
      { status: 400 },
    );
  }
}
