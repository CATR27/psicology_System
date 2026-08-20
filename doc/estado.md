# Estado actual del proyecto

## Por fase

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ⬜ Pendiente | Grabación, subida a R2, transcripción (Deepgram). |
| Fase 3 — IA | ⬜ Pendiente | Generación de expediente con Gemini. |
| Fase 4 — Agenda y recordatorios | 🟡 Parcial | Agenda (calendario mes/semana) y recordatorios por correo (Gmail). Falta: retención de audio, (opcional) Google Calendar. |
| Fase 5 — Pulido | 🟡 Parcial | Exportación a PDF básica hecha. Falta: dashboard de evolución, búsqueda, admin. |

## Funcionalidad construida (más allá del plan original)

- **Dashboard del paciente** con cards (historia clínica, nueva consulta, agenda).
- **Historia Clínica** (formato UAQ, 11 secciones, todo opcional) con autosave,
  % de progreso y exportación a PDF.
- **Formato de Sesión** (formato UAQ: objetivo, temas, señalamientos, clima
  afectivo con chips, observaciones) con versionado append-only y firma.
- **Agenda** con calendario (vista mes/semana), creación/cancelación de citas y
  recordatorios por correo.

## Roadmap pendiente

1. **Fase 2** — Grabadora de audio → R2 → transcripción (Deepgram).
2. **Fase 3** — IA: generar el expediente (formato de consulta) con Gemini.
3. **Fase 4 restante** — Retención de audio (cron 30 días), (opcional) Google Calendar.
4. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
5. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago, Deepgram sin retención — **antes de tocar datos reales**.
