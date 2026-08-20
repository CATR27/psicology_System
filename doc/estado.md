# Estado actual del proyecto

## Por fase

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ⬜ Pendiente | Grabación, subida a R2, transcripción (Deepgram). |
| Fase 3 — IA | ⬜ Pendiente | Generación de expediente con Gemini. |
| Fase 4 — Agenda y recordatorios | ✅ Terminada | Agenda (calendario mes/semana), citas, recordatorios por correo (Gmail) al psicólogo (24h y 1h) y al paciente (24h, opcional). Cron cada 15 min con GitHub Actions. |
| Fase 5 — Pulido | 🟡 Parcial | Exportación a PDF básica hecha. Falta: dashboard de evolución, búsqueda, admin. |

## Funcionalidad construida (más allá del plan original)

- **Dashboard del paciente** con cards (historia clínica, nueva consulta, agenda).
- **Historia Clínica** (formato UAQ, 11 secciones, todo opcional) con autosave,
  % de progreso y exportación a PDF.
- **Formato de Sesión** (formato UAQ: objetivo, temas, señalamientos, clima
  afectivo con chips, observaciones) con versionado append-only y firma.
- **Agenda** con calendario (vista mes/semana), creación/cancelación de citas y
  recordatorios por correo.
- **Borrar sesión** y **alerta al salir** de una sesión sin guardar.

## Nota sobre el deploy (importante para quien continúe)

> ⚠️ El archivo `vercel.json` con `crons` **rompía el deploy en Vercel Hobby**
> (no se creaba el deployment). Se eliminó y el cron de recordatorios se movió a
> **GitHub Actions** (`.github/workflows/reminders.yml`). **No volver a agregar
> `vercel.json` con `crons`** salvo que el proyecto suba a un plan que lo soporte.

## Roadmap pendiente

1. **Fase 2** — Grabadora de audio → R2 → transcripción (Deepgram).
2. **Fase 3** — IA: generar el expediente (formato de consulta) con Gemini.
3. **Fase 4 restante (opcional)** — Sincronización con Google Calendar.
4. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
5. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago, Deepgram sin retención — **antes de tocar datos reales**.
