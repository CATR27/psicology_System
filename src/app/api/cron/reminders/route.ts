import { sendDueReminders } from "@/lib/dal/reminders";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET ?? process.env.WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendDueReminders();
  return Response.json(result);
}
