# Cómo continuar (handoff para otra IA)

> **Pega esto (o la lectura de este archivo) a la siguiente IA** para que sepa en
> qué quedamos sin necesidad de investigar todo desde cero.

## Resumen de 30 segundos

Aplicación web **Next.js 16 + Prisma 7 + Clerk + Neon (Postgres)** para una
clínica de psicología, desplegada en **Vercel**. Ya funciona: registro/login,
pacientes, **historia clínica** (formato UAQ con autosave y %), **formato de
consulta por sesión** (append-only, con firma), **agenda con calendario** y
**recordatorios por correo al psicólogo** (Gmail SMTP + cron-job.org
primario / GitHub Actions respaldo, cada 15 min).

## Qué está TERMINADO y FUNCIONANDO

- Fase 0: auth (Clerk + organizaciones), BDD, proxy, Sentry, webhook sync, deploy.
- Fase 1: CRUD pacientes, sesiones, consentimientos, auditoría, aislamiento por
  org/psicólogo (prueba de aislamiento OK a nivel BD).
- Fase 4: agenda (`/agenda`, calendario mes/semana), crear/cancelar/reprogramar
  citas (modal de detalle), recordatorios **solo al psicólogo** (24h y 1h
  antes) con HTML profesional de marca. El paciente **no** recibe correo
  (decisión de producto — se quitó esa opción).
- Extras: dashboard del paciente, historia clínica UAQ, formato de sesión UAQ,
  exportación a PDF (pdf-lib), borrar sesión, alerta al salir sin guardar.
- Cron de recordatorios: **cron-job.org** (primario, confiable) +
  **GitHub Actions** (`/api/cron/reminders`, respaldo) — ambos verificados
  con 200 OK. GH Actions **schedule solo es best-effort** (puede tardar
  mucho o no disparar solo — confirmado en pruebas reales), por eso el
  primario es cron-job.org.

## Cómo probar / en qué estamos

- URL: `https://psicologysystem.vercel.app` (usuario: `catr2777@gmail.com`).
- Flujo crear cita → `Reminder` pendiente → cron dispara → correo llega,
  verificado con disparo **manual** (workflow_dispatch / test run). Falta
  confirmar que cron-job.org lo dispara **solo** en su intervalo automático
  (recién configurado, esperando primer tick).

## Reglas NO NEGOCIABLES (léelas antes de tocar código)

- `src/` usa **proxy.ts** (no middleware.ts) — Next 16. **No crear `vercel.json`
  con `crons`** (rompe el deploy en Hobby).
- **Nada fuera de `src/lib/dal/` importa `@/lib/prisma`** (regla de ESLint).
- Toda query de paciente filtra por `orgId` **y** `psicologoId`.
- Notas de consulta son **append-only** (editar una firmada = versión nueva).
- **Cero PII en logs**; Sentry filtra con `beforeSend`.
- `.env.local` no se commitea. Los secretos reales viven en Vercel y GitHub Secrets.
- Prisma 7: requiere `prisma.config.ts`, driver adapter `@prisma/adapter-pg`,
  y `postinstall: prisma generate` (cliente en `src/generated/prisma`).

## Lo que SIGUE (en orden sugerido)

1. **Fase 2 — Audio**: grabadora en el navegador (MediaRecorder), subida a
   **Cloudflare R2** con URLs prefirmadas, transcripción con **Deepgram**
   (modelo `nova-3`, es, diarización). Requiere: R2 (bucket + token) y API key de
   Deepgram (PUERTA del humano). Ver `PLAN_IMPLEMENTACION.md` Fase 2.
2. **Fase 3 — IA**: generar el **formato de consulta** automáticamente con
   **Gemini** (nivel de pago obligatorio) desde el transcript diarizado.
   Requiere `GEMINI_API_KEY` (PUERTA del humano + activar facturación).
3. **Fase 5**: dashboard de evolución, búsqueda full-text, admin, accesibilidad,
   PDF con logos y firmas digitales.
4. **Legal** (antes de datos reales): aviso de privacidad, consentimiento firmado,
   MFA, retención de datos.

## Archivos de referencia

- Plan original: `PLAN_IMPLEMENTACION.md` (ejecutar en orden, con sus puertas).
- Documentación actual: esta carpeta `doc/` (estado, infraestructura, arquitectura,
  modelo de datos, setup).
- Esquema BDD: `prisma/schema.prisma` (fuente de verdad).

---

*Última actualización: 2026-08-23 — cron movido a cron-job.org (primario) +
GitHub Actions (respaldo); recordatorio al paciente removido (solo
psicólogo); reprogramar/cancelar cita desde modal de detalle.*
