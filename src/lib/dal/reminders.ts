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
        },
      },
    },
  });

  let enviados = 0;
  for (const r of due) {
    const nombre = r.appointment.patient.nombre;
    const inicio = r.appointment.inicio;
    const subject = SUBJECTS[r.tipo] ?? "Recordatorio";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; line-height: 1.5">
        <h2 style="font-size: 18px; margin: 0 0 12px">${subject}</h2>
        <p style="margin: 4px 0">Paciente: <strong>${nombre}</strong></p>
        <p style="margin: 4px 0">Fecha: <strong>${fmt(inicio)}</strong></p>
        <p style="margin: 16px 0 0; color: #666; font-size: 12px">Este es un recordatorio automático.</p>
      </div>
    `;
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
