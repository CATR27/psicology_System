import "server-only";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS ?? "").replace(/\s+/g, ""),
  },
});

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  options?: { text?: string; urgent?: boolean; fromName?: string },
) {
  const fromName = options?.fromName ?? "Sistema de Citas";
  await transporter.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: options?.text,
    priority: options?.urgent ? "high" : undefined,
    headers: options?.urgent
      ? {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
        }
      : undefined,
  });
}
