# Modelo de datos (Postgres)

- `Organization` — clínica (Clerk org).
- `User` — psicólogo/recepción/admin (rol).
- `Patient` — paciente (nombre, fecha nacimiento, teléfono, email, estado).
- `Consent` — consentimientos (grabación / tratamiento IA), vigentes o revocados.
- `Appointment` — cita (paciente, psicólogo, inicio, fin, estado).
- `Session` — sesión de consulta (número de sesión por paciente).
- `Recording` — grabación (Fase 2, aún sin uso).
- `Transcript` / `TranscriptSegment` — transcripción (Fase 2, aún sin uso).
- `ClinicalNote` — nota de consulta (versionada, append-only, `contenidoJson`).
- `HistoriaClinica` — historia clínica del paciente (1 por paciente, `datos` JSON).
- `AiAnalysis` / `EmotionMetric` — IA (Fase 3, aún sin uso).
- `Reminder` — recordatorio (tipo, destinatario, hora programada, estado).
- `AuditLog` — auditoría de accesos (1 registro por lectura/escritura).

> El esquema completo vive en `prisma/schema.prisma` (fuente de verdad).
> Para cambios, correr `npx prisma migrate dev` y documentar aquí.
