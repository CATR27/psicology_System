import "server-only";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const SUBJECTS: Record<string, string> = {
  PSICOLOGO_DIA_ANTES: "Recordatorio de consulta (mañana)",
  PSICOLOGO_HORA_ANTES: "Recordatorio de consulta (en 1 hora)",
  PACIENTE_DIA_ANTES: "Recordatorio de tu cita",
};

function fmt(d: Date): string {
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "full",
    timeStyle: "short",
  });
}

type EmailAudience = "paciente" | "psicologo";

const AUDIENCE_THEME: Record<
  EmailAudience,
  { accent: string; accentSoft: string; badge: string }
> = {
  paciente: { accent: "#0f766e", accentSoft: "#f0fdfa", badge: "Cita" },
  psicologo: { accent: "#4338ca", accentSoft: "#eef2ff", badge: "Agenda" },
};

function buildReminderEmail(params: {
  tipo: string;
  subject: string;
  orgNombre: string;
  pacienteNombre: string;
  fecha: Date;
}): string {
  const { tipo, subject, orgNombre, pacienteNombre, fecha } = params;
  const audience: EmailAudience = tipo.startsWith("PACIENTE")
    ? "paciente"
    : "psicologo";
  const theme = AUDIENCE_THEME[audience];
  const saludo =
    audience === "paciente"
      ? `Hola, <strong>${pacienteNombre}</strong>. Te compartimos el recordatorio de tu próxima cita.`
      : `Tienes una consulta programada con <strong>${pacienteNombre}</strong>.`;
  const nota =
    audience === "paciente"
      ? "Si necesitas cambiar o cancelar tu cita, contacta directamente a la clínica."
      : "Recordatorio automático generado por el sistema de expedientes.";

  return `
    <div style="background-color: #f4f4f5; padding: 32px 16px; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
        <tr>
          <td style="background-color: ${theme.accent}; padding: 20px 28px;">
            <span style="display: inline-block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #ffffff; opacity: 0.85; font-weight: 600;">${theme.badge} · ${orgNombre}</span>
            <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 4px;">${subject}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px;">
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #27272a;">${saludo}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${theme.accentSoft}; border-radius: 8px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #71717a; font-weight: 600;">Fecha y hora</div>
                  <div style="font-size: 16px; font-weight: 700; color: #18181b; margin-top: 4px;">${fmt(fecha)}</div>
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #a1a1aa;">${nota}</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendDueReminders() {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: {
      estado: "PENDIENTE",
      programadoPara: { lte: now },
      appointment: { estado: { not: "CANCELADA" } },
    },
    include: {
      appointment: {
        include: {
          patient: { select: { nombre: true } },
          org: { select: { nombre: true } },
        },
      },
    },
  });

  let enviados = 0;
  for (const r of due) {
    const nombre = r.appointment.patient.nombre;
    const inicio = r.appointment.inicio;
    const subject = SUBJECTS[r.tipo] ?? "Recordatorio";
    const html = buildReminderEmail({
      tipo: r.tipo,
      subject,
      orgNombre: r.appointment.org.nombre,
      pacienteNombre: nombre,
      fecha: inicio,
    });
    try {
      await sendMail(r.destinatarioEmail, subject, html);
      await prisma.reminder.update({
        where: { id: r.id },
        data: { estado: "ENVIADO", enviadoEn: new Date() },
      });
      enviados++;
    } catch (e) {
      console.error(
        "Error enviando recordatorio",
        e instanceof Error ? e.message : e,
      );
      await prisma.reminder.update({
        where: { id: r.id },
        data: { estado: "FALLIDO" },
      });
    }
  }

  return { procesados: due.length, enviados };
}
