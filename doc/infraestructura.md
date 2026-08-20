# Infraestructura

## Servicios en uso

| Servicio | Uso | Plan | Variables |
|---|---|---|---|
| **Neon** (Postgres) | Base de datos | Free 0.5 GB | `DATABASE_URL` |
| **Clerk** | Autenticación + organizaciones | Hobby (gratis) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| **Vercel** | Hosting + Cron Jobs | Hobby (gratis) | `CRON_SECRET` |
| **Sentry** | Monitoreo de errores | Developer (gratis) | `SENTRY_DSN` |
| **Gmail (SMTP)** | Envío de recordatorios | Cuenta Google | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

## Servicios futuros (planeados)

| Servicio | Uso | Estado |
|---|---|---|
| Cloudflare R2 | Almacenar audio de sesiones | Pendiente (Fase 2) |
| Deepgram | Transcripción de audio | Pendiente (Fase 2) |
| Gemini (Google AI) | Generación de expediente con IA | Pendiente (Fase 3) |

## Variables de entorno

**Obligatorias (todas en `.env.local` local y en Vercel):**

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a Neon (con `?sslmode=require`). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Llave pública de Clerk. |
| `CLERK_SECRET_KEY` | Llave secreta de Clerk (jamás exponer). |
| `CLERK_WEBHOOK_SECRET` | Firma del webhook de Clerk (`whsec_...`). |
| `SENTRY_DSN` | DSN de Sentry. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP (Gmail: host `smtp.gmail.com`, puerto `465`). |
| `CRON_SECRET` | Protege `/api/cron/reminders` (Vercel Cron lo envía como `Authorization: Bearer`). |

**Futuras (cuando se activen Fases 2 y 3):**

| Variable | Descripción |
|---|---|
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2. |
| `DEEPGRAM_API_KEY`, `APP_URL`, `WEBHOOK_SECRET` | Deepgram + callback. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini (nivel de pago obligatorio). |

> ⚠️ Nunca commitear `.env.local` ni valores reales. Está en `.gitignore`.
