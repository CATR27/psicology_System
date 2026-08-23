import { sweepStuckRecordings } from "@/lib/dal/recordings";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.WEBHOOK_SECRET ?? process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sweepStuckRecordings();
  return Response.json(result);
}
