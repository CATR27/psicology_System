# Infraestructura

## Servicios en uso

| Servicio | Uso | Plan | Variables |
|---|---|---|---|
| **Neon** (Postgres) | Base de datos | Free 0.5 GB | `DATABASE_URL` |
| **Clerk** | Autenticación + organizaciones | Hobby (gratis) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| **Vercel** | Hosting | Hobby (gratis) | ver notas |
| **cron-job.org** | Cron de recordatorios + barredor, primario (cada 15 min) | Free | headers `Authorization: Bearer <CRON_SECRET>` / `<WEBHOOK_SECRET>` configurados en su panel, un cronjob por endpoint |
| **GitHub Actions** | Cron de recordatorios + barredor, respaldo (cada 15 min) | Gratis | `CRON_SECRET`, `WEBHOOK_SECRET` (secretos del repo) |
| **Sentry** | Monitoreo de errores | Developer (gratis) | `SENTRY_DSN` |
| **Gmail (SMTP)** | Envío de recordatorios | Cuenta Google | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **Cloudflare R2** | Almacenar audio de sesiones | Free 10GB, egress $0 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| **Deepgram** | Transcripción de audio (nova-3, es, diarización) | $200 crédito gratis | `DEEPGRAM_API_KEY` |
| **Gemini (Google AI)** | Generar borrador de nota desde el transcript | Nivel de pago (Tier 1), prepago mínimo $10 USD | `GEMINI_API_KEY`, `GEMINI_MODEL` |

> ⚠️ **Cron**: NO se usa Vercel Cron (el `vercel.json` con `crons` rompía el
> deploy en Hobby). Se usan dos triggers independientes por endpoint
> (`/api/cron/reminders` y `/api/cron/sweep`, ambos idempotentes — reintentar
> no duplica nada): **cron-job.org** como primario (scheduler dedicado,
> confiable) y **GitHub Actions** (`.github/workflows/reminders.yml` y
> `sweep.yml`) como respaldo. Se agregó cron-job.org porque el `schedule` de
> GitHub Actions es "best-effort" — documentado por GitHub como sin garantía
> de horario, y en pruebas reales tardó 1h+ sin disparar ni una vez solo.
> Config de cada cronjob en cron-job.org: GET a la URL del endpoint, header
> `Authorization: Bearer <secreto correspondiente>`, intervalo 15 min.
>
> **R2 CORS**: el bucket necesita política CORS (Settings → CORS Policy)
> permitiendo `PUT/GET/HEAD` desde el origin de prod y `localhost:3000` —
> si no, el navegador bloquea la subida directa aunque la URL prefirmada
> sea válida. Ya configurado en el bucket `psicologia-audio`.

## Variables de entorno

**Obligatorias (en `.env.local` local y en Vercel):**

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a Neon (con `?sslmode=require`). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Llave pública de Clerk. |
| `CLERK_SECRET_KEY` | Llave secreta de Clerk (jamás exponer). |
| `CLERK_WEBHOOK_SECRET` | Firma del webhook de Clerk (`whsec_...`). |
| `SENTRY_DSN` | DSN de Sentry. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP (Gmail: host `smtp.gmail.com`, puerto `465`). |
| `CRON_SECRET` | Protege `/api/cron/reminders`. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 (subida directa navegador→R2). |
| `DEEPGRAM_API_KEY` | Transcripción. |
| `APP_URL` | URL pública de la app — Deepgram la usa para el callback. |
| `WEBHOOK_SECRET` | Protege `/api/webhooks/deepgram` y `/api/cron/sweep`. |
| `GEMINI_API_KEY` | Nivel de pago obligatorio — nunca el free tier (Google entrena con esos datos, inaceptable con transcripciones clínicas). |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` (balance costo/razonamiento; `gemini-3.7-flash` disponible si se necesita mejor razonamiento). |

**Secretos en GitHub** (Settings → Secrets and variables → Actions):

| Nombre | Valor |
|---|---|
| `CRON_SECRET` | Igual que en Vercel. Lo envía `reminders.yml` como `Authorization: Bearer`. |
| `WEBHOOK_SECRET` | Igual que en Vercel. Lo envía `sweep.yml` como `Authorization: Bearer`. |

> Cada secreto debe ser **igual en Vercel y en GitHub** — Vercel lo valida en
> el endpoint, GitHub Actions lo envía en el encabezado.

> ⚠️ Nunca commitear `.env.local` ni valores reales. Está en `.gitignore`.
