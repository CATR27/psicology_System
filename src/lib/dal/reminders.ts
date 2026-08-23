import "server-only";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const SUBJECTS: Record<string, string> = {
  PSICOLOGO_DIA_ANTES: "Recordatorio: consulta mañana",
  PSICOLOGO_HORA_ANTES: "En 1 hora: tu próxima consulta",
};

const URGENT_TIPOS = new Set(["PSICOLOGO_HORA_ANTES"]);

const THEME = { accent: "#4338ca", accentSoft: "#eef2ff", badge: "Agenda" };
const URGENT_THEME = { accent: "#b91c1c", accentSoft: "#fef2f2", badge: "Próxima" };

function fmt(d: Date): string {
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function fmtHora(d: Date): string {
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    timeStyle: "short",
  });
}

function buildReminderEmail(params: {
  subject: string;
  urgent: boolean;
  orgNombre: string;
  pacienteNombre: string;
  pacienteContacto: string | null;
  pacienteEmail: string | null;
  inicio: Date;
  fin: Date;
}): { html: string; text: string } {
  const {
    subject,
    urgent,
    orgNombre,
    pacienteNombre,
    pacienteContacto,
    pacienteEmail,
    inicio,
    fin,
  } = params;
  const theme = urgent ? URGENT_THEME : THEME;
  const duracionMin = Math.round((fin.getTime() - inicio.getTime()) / 60000);

  const contactoRows = [
    pacienteContacto ? `Tel: ${pacienteContacto}` : null,
    pacienteEmail ? `Correo: ${pacienteEmail}` : null,
  ].filter(Boolean);

  const html = `
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
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #27272a;">Tienes una consulta programada con <strong>${pacienteNombre}</strong>.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${theme.accentSoft}; border-radius: 8px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #71717a; font-weight: 600;">Fecha y hora</div>
                  <div style="font-size: 16px; font-weight: 700; color: #18181b; margin-top: 4px;">${fmt(inicio)}</div>
                  <div style="font-size: 12px; color: #52525b; margin-top: 6px;">Duración estimada: ${duracionMin} min · Termina ${fmtHora(fin)}</div>
                </td>
              </tr>
            </table>
            ${
              contactoRows.length > 0
                ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px; border: 1px solid #e4e4e7; border-radius: 8px;">
              <tr>
                <td style="padding: 14px 20px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #71717a; font-weight: 600;">Contacto del paciente</div>
                  <div style="font-size: 13px; color: #27272a; margin-top: 4px; line-height: 1.6;">${contactoRows.join("<br>")}</div>
                </td>
              </tr>
            </table>`
                : ""
            }
            <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #a1a1aa;">Recordatorio automático generado por el sistema de expedientes.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    subject,
    "",
    `Paciente: ${pacienteNombre}`,
    `Fecha y hora: ${fmt(inicio)}`,
    `Duración estimada: ${duracionMin} min (termina ${fmtHora(fin)})`,
    ...contactoRows,
    "",
    `${orgNombre} — recordatorio automático del sistema de expedientes.`,
  ].join("\n");

  return { html, text };
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
          patient: { select: { nombre: true, contacto: true, email: true } },
          org: { select: { nombre: true } },
        },
      },
    },
  });

  let enviados = 0;
  for (const r of due) {
    const { patient, org, inicio, fin } = r.appointment;
    const urgent = URGENT_TIPOS.has(r.tipo);
    const subject = SUBJECTS[r.tipo] ?? "Recordatorio";
    const { html, text } = buildReminderEmail({
      subject,
      urgent,
      orgNombre: org.nombre,
      pacienteNombre: patient.nombre,
      pacienteContacto: patient.contacto,
      pacienteEmail: patient.email,
      inicio,
      fin,
    });
    try {
      await sendMail(r.destinatarioEmail, subject, html, { text, urgent });
      await prisma.reminder.updateMany({
        where: { id: r.id },
        data: { estado: "ENVIADO", enviadoEn: new Date() },
      });
      enviados++;
    } catch (e) {
      console.error(
        "Error enviando recordatorio",
        e instanceof Error ? e.message : e,
      );
      await prisma.reminder.updateMany({
        where: { id: r.id },
        data: { estado: "FALLIDO" },
      });
    }
  }

  return { procesados: due.length, enviados };
}
