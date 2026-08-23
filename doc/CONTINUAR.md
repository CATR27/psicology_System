# Cómo continuar (handoff para otra IA)

> **Pega esto (o la lectura de este archivo) a la siguiente IA** para que sepa en
> qué quedamos sin necesidad de investigar todo desde cero.

## Resumen de 30 segundos

Aplicación web **Next.js 16 + Prisma 7 + Clerk + Neon (Postgres)** para una
clínica de psicología, desplegada en **Vercel**. Ya funciona: registro/login,
pacientes, **historia clínica** (formato UAQ con autosave y %), **formato de
consulta por sesión** (append-only, con firma), **agenda con calendario**,
**recordatorios por correo al psicólogo** (Gmail SMTP + cron-job.org
primario / GitHub Actions respaldo, cada 15 min), y **grabación de audio →
transcripción** (R2 + Deepgram, probado con audio real de punta a punta).

## Qué está TERMINADO y FUNCIONANDO

- Fase 0: auth (Clerk + organizaciones), BDD, proxy, Sentry, webhook sync, deploy.
- Fase 1: CRUD pacientes, sesiones, consentimientos, auditoría, aislamiento por
  org/psicólogo (prueba de aislamiento OK a nivel BD).
- Fase 2: grabador en `/sesiones/[id]` (MediaRecorder, bloquea sin
  consentimiento GRABACION vigente) → subida multipart directa navegador→R2
  (URLs prefirmadas, el audio **nunca** pasa por Next) → Deepgram
  (nova-3/es/diarize/utterances, callback async) → webhook guarda
  Transcript+TranscriptSegment → visor con burbujas y reasignar hablante.
  Barredor de reintentos (`/api/cron/sweep`, mismo patrón dual que
  recordatorios) para grabaciones atoradas >30 min.
- Fase 4: agenda (`/agenda`, calendario mes/semana), crear/cancelar/reprogramar
  citas (modal de detalle), recordatorios **solo al psicólogo** (24h y 1h
  antes) con HTML profesional de marca. El paciente **no** recibe correo
  (decisión de producto — se quitó esa opción).
- Extras: dashboard del paciente, historia clínica UAQ, formato de sesión UAQ,
  exportación a PDF (pdf-lib), borrar sesión, alerta al salir sin guardar.
- Cron (recordatorios y barredor): **cron-job.org** (primario, confiable) +
  **GitHub Actions** (respaldo) — GH Actions **schedule es best-effort**
  (puede tardar mucho o no disparar solo — confirmado en pruebas reales),
  por eso el primario es cron-job.org. Verificado con disparo automático
  real (no solo manual) para recordatorios.

## Cómo probar / en qué estamos

- URL: `https://psicologysystem.vercel.app` (usuario: `catr2777@gmail.com`).
- Guion de prueba inventado para grabar consultas falsas:
  `test-fixtures/consulta-prueba.md` (nunca usar audio de pacientes reales
  en dev — regla permanente del plan).
- Pendiente de probar por el humano: diarización con **dos voces reales
  distintas** (la única prueba hecha fue una persona leyendo ambos papeles,
  por eso Deepgram detectó un solo hablante — comportamiento esperado, no
  bug).

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
- **`proxy.ts` NO excluye `api/recordings`** — solo `api/webhooks` y
  `api/cron` (sin sesión de Clerk). Excluir `api/recordings` rompe
  `auth()` porque esas rutas sí necesitan la sesión de Clerk (solo manejan
  JSON chico; el audio va directo del navegador a R2, nunca por Next).

## Lo que SIGUE (en orden sugerido)

1. **Fase 3 — IA**: generar el **formato de consulta** automáticamente con
   **Gemini** (nivel de pago obligatorio) desde el transcript diarizado ya
   disponible. Requiere `GEMINI_API_KEY` (PUERTA del humano + activar
   facturación en Google Cloud, no basta la API key).
2. **Fase 5**: dashboard de evolución, búsqueda full-text, admin, accesibilidad,
   PDF con logos y firmas digitales.
3. **Legal** (antes de datos reales): aviso de privacidad, consentimiento firmado,
   MFA, retención de datos.

## Archivos de referencia

- Plan original: `PLAN_IMPLEMENTACION.md` (ejecutar en orden, con sus puertas).
- Documentación actual: esta carpeta `doc/` (estado, infraestructura, arquitectura,
  modelo de datos, setup).
- Esquema BDD: `prisma/schema.prisma` (fuente de verdad).

---

*Última actualización: 2026-08-23 — Fase 2 completa (grabación → R2 →
Deepgram → visor de transcript + barredor de reintentos); cron movido a
cron-job.org (primario) + GitHub Actions (respaldo); recordatorio al
paciente removido (solo psicólogo); reprogramar/cancelar cita desde modal
de detalle.*
