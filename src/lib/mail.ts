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

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}
