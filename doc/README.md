# Sistema de Expedientes Clínicos con IA — Documentación

> **📌 Regla obligatoria:** todo cambio en el proyecto (código, infraestructura,
> base de datos, servicios, variables de entorno, o decisiones de negocio) **se
> documenta aquí**. Si tocas algo y este documento no lo refleja, actualízalo en
> el mismo cambio. Cualquier persona debe poder abrir esta carpeta y entender
> **el estado actual del proyecto, su infraestructura y en qué va**.

---

## 1. Qué es

Sistema de expedientes clínicos para una clínica de psicología con varios
psicólogos. El psicólogo registra pacientes, lleva su **historia clínica**, llena
un **formato de consulta** en cada sesión, agenda **citas** con **recordatorios
por correo**, y exporta todo a **PDF**. Está planeado que grabe audio, lo
transcriba y lo analice con IA (pendiente).

**Stack:** Next.js 16.3.1 (App Router), React 19, TypeScript, Tailwind 4,
shadcn/ui, Prisma 7, PostgreSQL (Neon), Clerk (auth), Sentry (monitoreo),
nodemailer (correo).

---

## 2. Estado actual (en qué va)

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ⬜ Pendiente | Grabación, subida a R2, transcripción (Deepgram). |
| Fase 3 — IA | ⬜ Pendiente | Generación de expediente con Gemini. |
| Fase 4 — Agenda y recordatorios | 🟡 Parcial | Agenda (calendario mes/semana) y recordatorios por correo (Gmail). Falta: retención de audio, (opcional) Google Calendar. |
| Fase 5 — Pulido | 🟡 Parcial | Exportación a PDF básica hecha. Falta: dashboard de evolución, búsqueda, admin. |

### Funcionalidad construida (más allá del plan original)

- **Dashboard del paciente** con cards (historia clínica, nueva consulta, agenda).
- **Historia Clínica** (formato UAQ, 11 secciones, todo opcional) con autosave,
  % de progreso y exportación a PDF.
- **Formato de Sesión** (formato UAQ: objetivo, temas, señalamientos, clima
  afectivo con chips, observaciones) con versionado append-only y firma.
- **Agenda** con calendario (vista mes/semana), creación/cancelación de citas y
  recordatorios por correo.

---

## 3. Infraestructura (servicios)

| Servicio | Uso | Plan | Variables |
|---|---|---|---|
| **Neon** (Postgres) | Base de datos | Free 0.5 GB | `DATABASE_URL` |
| **Clerk** | Autenticación + organizaciones | Hobby (gratis) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| **Vercel** | Hosting + Cron Jobs | Hobby (gratis) | `CRON_SECRET` |
| **Sentry** | Monitoreo de errores | Developer (gratis) | `SENTRY_DSN` |
| **Gmail (SMTP)** | Envío de recordatorios | Cuenta Google | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

### Servicios futuros (planeados)

| Servicio | Uso | Estado |
|---|---|---|
| Cloudflare R2 | Almacenar audio de sesiones | Pendiente (Fase 2) |
| Deepgram | Transcripción de audio | Pendiente (Fase 2) |
| Gemini (Google AI) | Generación de expediente con IA | Pendiente (Fase 3) |

---

## 4. Arquitectura

```
src/
├── app/                     # Rutas (App Router)
│   ├── agenda/              # Calendario de citas
│   ├── pacientes/           # CRUD + dashboard + historia clínica
│   ├── sesiones/            # Formato de consulta por sesión
│   ├── actions/             # Server Actions (autentican dentro)
│   └── api/
│       ├── webhooks/clerk/  # Sync Clerk → BDD (verifica firma)
│       └── cron/reminders/  # Envía recordatorios vencidos (cron)
├── components/              # Componentes de UI (shadcn + propios)
├── lib/
│   ├── dal/                 # Data Access Layer (ÚNICO punto de acceso a BDD)
│   ├── schemas/             # Schemas Zod + tipos
│   ├── prisma.ts            # Cliente singleton de Prisma
│   ├── mail.ts              # Envío de correo (nodemailer)
│   └── pdf.ts               # Generación de PDF (pdf-lib)
├── generated/prisma/        # Cliente Prisma generado (no editar)
├── instrumentation.ts       # Sentry (register + onRequestError)
└── proxy.ts                 # clerkMiddleware (antes middleware.ts)
```

### Decisiones clave

- **Next.js 16**: se usa `proxy.ts` (no `middleware.ts`), APIs dinámicas 100%
  async, `after()` para trabajo post-respuesta, `updateTag`/`revalidatePath`.
- **Prisma 7**: requiere `prisma.config.ts`, generador `prisma-client`, driver
  adapter `@prisma/adapter-pg`. El cliente se genera en `src/generated/prisma`
  (gitignored) y se regenera con `postinstall`.
- **Capa DAL**: ningún archivo fuera de `src/lib/dal/` importa `@/lib/prisma`
  (regla de ESLint que lo bloquea). Todo acceso a datos de paciente filtra por
  `orgId` **y** `psicologoId`.
- **Append-only**: las notas de consulta (`ClinicalNote`) no se editan; editar
  una nota firmada crea una versión nueva. Requisito legal (NOM-004).
- **Cero PII en logs**: Sentry con `beforeSend` que descarta contenido clínico.

---

## 5. Modelo de datos (Postgres)

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

---

## 6. Variables de entorno

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

---

## 7. Cómo correr localmente

```bash
# 1. Instalar dependencias (genera el cliente de Prisma)
npm install

# 2. Configurar .env.local (copiar de la tabla de arriba)

# 3. Migrar la base de datos (si hay cambios en schema.prisma)
npx prisma migrate dev

# 4. Levantar en desarrollo
npm run dev          # http://localhost:3000

# 5. Verificar antes de subir
npm run lint
npm run build
```

**Útiles:**

```bash
npx prisma studio   # ver/editar datos en la BD
npx prisma generate # regenerar el cliente si cambia el schema
```

---

## 8. Despliegue (Vercel)

- Repo conectado a Vercel (branch `main` → deploy automático).
- **Cron**: definido en `vercel.json` (`/api/cron/reminders` cada 15 min).
- Al agregar/quitar variables de entorno en Vercel, hacer **Redeploy**.
- El webhook de Clerk apunta a `https://psicologysystem.vercel.app/api/webhooks/clerk`.

---

## 9. Flujos principales

1. **Registro/login** → Clerk crea usuario + organización → el webhook los
   sincroniza en la BDD.
2. **Paciente** → crear/editar → dashboard con cards.
3. **Historia clínica** → wizard de 11 secciones, autosave y % de progreso.
4. **Consulta** → sesión → formato de consulta → firmar (append-only) → PDF.
5. **Agenda** → crear cita (paciente + fecha/hora) → genera recordatorios →
   el cron envía correos al psicólogo (24h y 1h antes) y al paciente (24h, opcional).

---

## 10. Seguridad (invariantes)

- Aislamiento por `orgId` + `psicologoId` en **toda** query de datos de paciente.
- Notas de consulta **append-only** (nunca `UPDATE` destructivo).
- Todo lo generado por IA nacerá en `BORRADOR` y requerirá revisión humana.
- Cero contenido clínico en logs (Sentry filtra con `beforeSend`).
- Consentimiento informado obligatorio antes de grabar/procesar datos reales.

---

## 11. Pendiente / Roadmap

1. **Fase 2** — Grabadora de audio → R2 → transcripción (Deepgram).
2. **Fase 3** — IA: generar el expediente (formato de consulta) con Gemini.
3. **Fase 4 restante** — Retención de audio (cron 30 días), (opcional) Google Calendar.
4. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
5. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago, Deepgram sin retención — **antes de tocar datos reales**.

---

*Última actualización: se refleja el estado al cierre de Fase 0 y Fase 1, y el
avance de Fase 4 (agenda + recordatorios por Gmail).*
