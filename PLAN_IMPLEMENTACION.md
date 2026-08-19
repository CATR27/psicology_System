# Plan de Implementación — Sistema de Expedientes Clínicos con IA

> Documento de ejecución. Está ordenado **cronológicamente**: se ejecuta de arriba hacia abajo, sin saltarse pasos.

---

## Cómo usar este documento

**Para la IA que ejecuta:**

1. Ejecuta las fases **en orden**. No empieces la Fase N+1 sin que la Fase N pase su Verificación.
2. Antes de cada fase hay una **🛑 PUERTA**: cosas que solo el humano puede hacer (registrarse en un servicio, copiar una API key). **Detente ahí.** Muestra al usuario exactamente qué necesitas, espera a que te confirme que las variables ya están en `.env.local`, y solo entonces sigue.
3. **Nunca inventes una API key ni supongas que ya existe.** Verifica con `process.env.X` antes de escribir código que la use.
4. Este proyecto usa **Next.js 16.3.1**, que tiene cambios rompientes frente a casi todo lo publicado en internet. Antes de escribir un patrón nuevo, lee la guía correspondiente en `node_modules/next/dist/docs/`. La sección "Referencia rápida Next 16" al final lista las trampas ya identificadas.
5. Al terminar cada fase, marca su casilla en la sección **Progreso** y haz commit.

**Para el humano:** tu trabajo es dar de alta servicios y pegar keys. El documento te dice exactamente cuándo y cuáles.

---

## Estado del repo al empezar

`create-next-app` vacío. Next.js **16.3.1**, React **19.2.8**, Tailwind **4**, TypeScript. Solo existe `src/app/{layout.tsx,page.tsx,globals.css}`.

## Qué se está construyendo

Sistema de expedientes clínicos para una clínica de psicología con varios psicólogos. El psicólogo graba la sesión desde el navegador; el sistema transcribe, identifica quién habló, analiza con IA y genera un expediente clínico estructurado. Incluye agenda y recordatorios por correo.

## Presupuesto

**Todo $0 excepto la IA.** Costo esperado de una prueba de 100 sesiones: **≈ $2 USD**.

| Servicio | Plan | Costo |
|---|---|---|
| Vercel Hobby | gratis | $0 |
| Neon Postgres | free 0.5 GB | $0 |
| Clerk Hobby | 50k usuarios / 100 orgs | $0 |
| Cloudflare R2 | free 10 GB, egress $0 | $0 |
| Deepgram | $200 de crédito ≈ 430 h | $0 |
| Brevo SMTP | 300 correos/día | $0 |
| GitHub Actions | cron gratis | $0 |
| Sentry | 5k eventos/mes | $0 |
| **Gemini 3.7 Flash** | pago por uso | **~$0.02/sesión** |

Dos condiciones a saber desde ahora:
- **Vercel Hobby prohíbe uso comercial.** Para probar está bien. El día que la clínica cobre usando esto → Pro ($20/mes) u otro host.
- **Deepgram es gratis hasta agotar los $200.** Después son $0.46/hora.

---

## ⚠️ Reglas permanentes — aplican en TODAS las fases

Estas no son sugerencias. Romper cualquiera de ellas es un bug de seguridad.

1. **Ningún archivo fuera de `src/lib/dal/` importa `@/lib/prisma`.** Hay una regla de ESLint que lo bloquea. La capa DAL es el único control de acceso — aquí no hay RLS que te salve.
2. **Toda query de datos de paciente filtra por `orgId` Y por `psicologoId`.** Sin excepción.
3. **`ClinicalNote` es append-only.** Nunca un `UPDATE` destructivo sobre un expediente: se crea una versión nueva. Requisito legal (NOM-004-SSA3-2012).
4. **Todo expediente generado por IA nace en estado `BORRADOR`** y requiere edición y firma humana. La IA no diagnostica y la UI debe decirlo.
5. **Cero PII en logs.** Nunca `console.log` de contenido clínico. Sentry con `beforeSend` que descarte texto de transcripts.
6. **Gemini siempre en nivel de pago, nunca en el gratuito.** Ver la Puerta de la Fase 3.
7. **El audio nunca pasa por el servidor Next.** Sube directo del navegador a R2 con URL prefirmada.
8. **Durante el desarrollo se usan transcripciones inventadas.** Nada de audio de pacientes reales hasta que exista consentimiento firmado y aviso de privacidad.

---

# FASE 0 — Cimientos

## 🛑 PUERTA 0 — Registros que debe hacer el humano

Detente. Pide al usuario que haga esto y confirme:

| # | Servicio | Qué hacer | Qué entregar |
|---|---|---|---|
| 1 | **Neon** — neon.tech | Crear cuenta con GitHub → nuevo proyecto, región cercana a México (`us-east-1` o `us-west-2`) | `DATABASE_URL` (la cadena con `?sslmode=require`) |
| 2 | **Clerk** — clerk.com | Crear cuenta → nueva aplicación → activar **Organizations** en el dashboard → activar Email + Password y MFA | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| 3 | **Vercel** — vercel.com | Crear cuenta con GitHub. **No conectar el repo todavía** — se hace al final de la fase | — |
| 4 | **Sentry** — sentry.io | Crear cuenta → proyecto Next.js | `SENTRY_DSN` |

`.env.local` al terminar esta puerta:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
SENTRY_DSN=
```

**No sigas hasta que el usuario confirme que las cuatro variables están puestas.**

## Tareas

1. Crear `.gitignore` con `.env*.local`, `node_modules`, `.next`. **Verificar que `.env.local` nunca entre a git.**
2. Instalar dependencias:
   ```bash
   npm i prisma @prisma/client @clerk/nextjs zod react-hook-form @hookform/resolvers @sentry/nextjs
   npx shadcn@latest init
   ```
3. `npx prisma init` → escribir `prisma/schema.prisma` completo (ver **Apéndice A**). Correr `npx prisma migrate dev --name init`.
4. `src/lib/prisma.ts` — cliente singleton (evita agotar conexiones en dev por hot reload).
5. `src/lib/dal/context.ts`:
   ```ts
   import "server-only";
   import { cache } from "react";
   import { auth } from "@clerk/nextjs/server";
   import { redirect } from "next/navigation";

   export const requireContext = cache(async () => {
     const { userId, orgId, orgRole } = await auth();
     if (!userId || !orgId) redirect("/sign-in");
     return { userId, orgId, orgRole };
   });
   ```
6. **`proxy.ts` en la raíz** (NO `middleware.ts` — ver Referencia Next 16):
   ```ts
   import { clerkMiddleware } from "@clerk/nextjs/server";

   export default clerkMiddleware();

   export const config = {
     matcher: [
       // CRÍTICO: excluye subidas y webhooks, o Next trunca los bodies en silencio
       "/((?!_next|api/recordings|api/webhooks|.*\\.(?:png|jpg|svg|ico)$).*)",
     ],
   };
   ```
7. `eslint.config.mjs` — añadir la regla que blinda el DAL:
   ```js
   {
     files: ["src/**/*.{ts,tsx}"],
     ignores: ["src/lib/dal/**", "src/lib/prisma.ts"],
     rules: {
       "no-restricted-imports": ["error", {
         paths: [{
           name: "@/lib/prisma",
           message: "Acceso a BDD solo desde src/lib/dal/. Ahí vive el control de acceso.",
         }],
       }],
     },
   }
   ```
8. Sentry: `instrumentation.ts` con `register()` + `onRequestError()`, y `beforeSend` que descarte campos de texto clínico.
9. Sincronizar Clerk → BDD: webhook en `src/app/api/webhooks/clerk/route.ts` que cree/actualice `Organization` y `User` en Postgres. Verificar la firma del webhook.
10. Layout base con `<ClerkProvider>`, `<OrganizationSwitcher>` y navegación. Páginas `/sign-in` y `/sign-up`.
11. Conectar el repo a Vercel, cargar las env vars, hacer el primer deploy.

## ✅ Verificación Fase 0

- [x] `npm run build` y `npm run lint` sin errores.
- [x] **`clerkMiddleware` funciona dentro de `proxy.ts`.** Si `@clerk/nextjs` todavía no lo soporta → detente y avisa al usuario: la salida es usar `middleware.ts` (deprecado, aún funciona) o cambiar a Better Auth. Es bloqueante.
- [x] Registrarse crea una fila en `Organization` y otra en `User` — verificado en `npx prisma studio`.
- [x] El deploy en Vercel carga y permite iniciar sesión.
- [x] `git log` no contiene ninguna API key.

---

# FASE 1 — Expediente manual (sin nada de IA)

> **Por qué antes que la IA:** es tentador empezar por lo divertido, pero si el modelo de expediente está mal, todo el pipeline se reconstruye. Aquí se valida gratis.

## 🛑 PUERTA 1 — Ninguna

No requiere servicios nuevos. Sigue directo.

## Tareas

1. `src/lib/dal/patients.ts`, `sessions.ts`, `notes.ts`. Todas las funciones siguen este patrón:
   ```ts
   export async function getPatient(patientId: string) {
     const ctx = await requireContext();
     const patient = await prisma.patient.findFirst({
       where: {
         id: patientId,
         orgId: ctx.orgId,                                                 // aísla clínica
         ...(ctx.orgRole === "admin" ? {} : { psicologoId: ctx.userId }),  // aísla psicólogo
       },
     });
     if (!patient) notFound();
     after(() => audit(ctx, "patient.read", patientId));
     return patient;
   }
   ```
2. Schemas Zod en `src/lib/schemas/` — uno por entidad. Se reusan en Fase 3 para generar el JSON Schema de Gemini, así que diseñar el de la nota SOAP con cuidado.
3. CRUD de pacientes: listado, alta, detalle, edición. Server Actions que **autentican dentro de la acción** (un Server Action es un POST público).
4. CRUD de sesiones ligadas a paciente.
5. Editor de nota SOAP escrita a mano → crea `ClinicalNote` versión 1 en `BORRADOR`. Acción de firmar → `FIRMADA` con `firmadaEn` y `firmadaPorId`. **Editar una nota firmada crea una versión nueva, no la modifica.**
6. Timeline del paciente: sesiones en orden con sus notas.
7. `src/lib/audit.ts` — helper `audit()` llamado en toda lectura/escritura de datos de paciente.
8. Registro de consentimiento: alta de `Consent` con fecha y archivo de evidencia.

## ✅ Verificación Fase 1

- [ ] **Prueba de aislamiento (la más importante de todo el proyecto):** crear 2 organizaciones con 1 psicólogo cada una. Desde la sesión de A, pedir por **URL directa** el ID de un paciente de B → debe dar **404**. Repetir contra el endpoint del Server Action, no solo contra la UI.
- [ ] Firmar una nota y luego editarla deja **dos** filas en `ClinicalNote`, no una modificada.
- [ ] `AuditLog` tiene un registro por cada lectura de paciente.
- [ ] `npm run lint` falla si se importa `@/lib/prisma` desde un componente (probarlo a propósito una vez).

---

# FASE 2 — Audio → transcripción

## 🛑 PUERTA 2 — Registros que debe hacer el humano

| # | Servicio | Qué hacer | Qué entregar |
|---|---|---|---|
| 1 | **Cloudflare R2** — dash.cloudflare.com | Crear cuenta → R2 → crear bucket `psicologia-audio` → API Tokens → token con permiso de Object Read & Write | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| 2 | **Deepgram** — deepgram.com | Crear cuenta (**no pide tarjeta**, incluye $200 de crédito sin expiración) → API Keys → crear key | `DEEPGRAM_API_KEY` |

También hay que definir:
```env
APP_URL=https://tu-app.vercel.app   # Deepgram necesita una URL pública para el callback
WEBHOOK_SECRET=                      # genera uno: openssl rand -hex 32
```

> **Nota para desarrollo local:** el webhook de Deepgram no puede llegar a `localhost`. Usa `ngrok http 3000` y pon esa URL en `APP_URL` mientras desarrollas.

## Tareas

1. `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` (R2 es compatible con S3).
2. `src/lib/r2.ts` — cliente S3 apuntando a R2 y helper de URLs prefirmadas.
3. `POST /api/recordings/start` → crea `Recording` en `PENDIENTE`, devuelve URLs prefirmadas para subida multipart.
4. **Grabador en el navegador** (`src/components/recorder/`):
   - `MediaRecorder` con `timeslice` de 10 s.
   - Cada chunk sube directo a R2 conforme se genera. **No acumular 90 minutos en memoria.**
   - Cursor de progreso en **IndexedDB** → si se cierra la pestaña, al recargar se ofrece reanudar.
   - Detectar codec con `MediaRecorder.isTypeSupported`, con fallback a `audio/mp4` para Safari/iOS.
   - UI: tiempo transcurrido, medidor de nivel, pausar/reanudar, y **bloqueo si el paciente no tiene consentimiento vigente**.
5. `POST /api/recordings/[id]/complete` → cierra el multipart, estado `SUBIDO`, y llama a Deepgram:
   ```ts
   // Nova-3, español, diarización, callback asíncrono
   { model: "nova-3", language: "es", diarize: true, punctuate: true,
     smart_format: true, callback: `${APP_URL}/api/webhooks/deepgram?token=...` }
   ```
   Estado → `TRANSCRIBIENDO`.
6. `POST /api/webhooks/deepgram` → verifica el token, guarda `Transcript` + `TranscriptSegment[]` con hablante y timestamps. Estado → `TRANSCRITO`.
7. Visor de transcript: burbujas por hablante con timestamps, y **botón para reasignar hablante** (la diarización se equivoca; nunca asumir que el hablante 0 es el psicólogo).
8. **Barredor de reintentos:** `GET /api/cron/sweep` protegido por `WEBHOOK_SECRET`; busca `Recording` atorados más de 30 min y reintenta, incrementando `intentos`. Se dispara desde `.github/workflows/cron.yml` cada 15 min.

## ✅ Verificación Fase 2

- [ ] **Subir un archivo de 20 MB y comparar checksum contra el objeto en R2.** Esto detecta el truncado silencioso de `proxy.ts` — si no coinciden, el `matcher` está mal.
- [ ] Grabar 5 minutos, cerrar la pestaña a la mitad, recargar → se reanuda y el audio final está íntegro.
- [ ] Probar en **Safari/iOS** — es donde `MediaRecorder` falla.
- [ ] Una grabación real llega hasta `TRANSCRITO` con segmentos separados por hablante.
- [ ] Matar el proceso a la mitad y confirmar que el barredor lo reintenta.

---

# FASE 3 — IA: generación del expediente

## 🛑 PUERTA 3 — Registro que debe hacer el humano

> ### ⚠️ Leer esto completo antes de continuar
>
> **En el nivel gratuito de la API de Gemini, Google puede usar tus prompts y las respuestas para mejorar sus productos, y eso incluye revisión humana.**
>
> Los prompts de este sistema son **transcripciones de sesiones de psicoterapia**. Usarlas en el nivel gratuito expondría datos personales sensibles de pacientes a terceros — inaceptable ética y legalmente bajo la LFPDPPP.
>
> **Es obligatorio activar facturación y usar el nivel de pago desde la primera llamada.** En el nivel de pago Google no entrena con tus datos ni los usa para mejorar sus productos.
>
> El costo de todos modos es ~$2 por 100 sesiones. Esto no es un gasto opcional: es el requisito mínimo para tocar datos clínicos.

| # | Servicio | Qué hacer | Qué entregar |
|---|---|---|---|
| 1 | **Google AI Studio** — aistudio.google.com | Crear API key → **vincular una cuenta de facturación de Google Cloud** → confirmar que el proyecto quedó en nivel de pago, no en free tier | `GEMINI_API_KEY` |

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash
```

**Antes de escribir código:** confirma con el usuario que la facturación está activa. Mientras tanto, desarrolla con transcripciones inventadas.

## Tareas

1. `npm i @google/genai`

2. `src/lib/ai/gemini.ts`. **La API actual es esta** — los tutoriales viejos muestran `models.generateContent` y el paquete `@google/generative-ai`; ambos son obsoletos:
   ```ts
   import { GoogleGenAI } from "@google/genai";

   const ai = new GoogleGenAI({});

   const interaction = await ai.interactions.create({
     model: process.env.GEMINI_MODEL!,
     input: prompt,
     response_format: {
       type: "text",
       mime_type: "application/json",
       schema: expedienteJsonSchema,   // derivado del Zod de la Fase 1
     },
   });
   ```

3. Prompt clínico en `src/lib/ai/prompts/expediente.ts`. Recibe el transcript **diarizado con timestamps** y devuelve:
   - **SOAP**: Subjetivo, Objetivo, Análisis, Plan.
   - Temas principales y temas recurrentes vs. sesiones anteriores.
   - **Señales de riesgo** (ideación suicida, autolesión, violencia) — marcadas aparte y siempre visibles.
   - Tareas / encargos para el paciente.
   - Emociones detectadas con intensidad y momento.
   - **Cada afirmación debe citar el timestamp del segmento que la respalda.** Esto es lo que permite auditar alucinaciones.

   El prompt debe decir explícitamente: *no diagnosticar, no inventar, no inferir lo que no se dijo; si no hay evidencia, dejar el campo vacío.*

4. Encadenar en el webhook de Deepgram: tras guardar el transcript, `after()` → Gemini → `ClinicalNote` en `BORRADOR` + `AiAnalysis` + `EmotionMetric[]`. Estados `ANALIZANDO` → `LISTO`.

5. **Registrar costo siempre**: `AiAnalysis` guarda `modelo`, `tokensIn`, `tokensOut`, `costoUsd`. Sin esto no hay forma de saber si la factura se está saliendo de control.

6. UI de revisión: expediente generado al lado del transcript, cada afirmación clicable para saltar al momento del audio que la respalda. Editar → firmar. Tras firmar, `updateTag()` para que el cambio se vea de inmediato (`revalidateTag` de un solo argumento está deprecado en Next 16).

7. Comparación entre sesiones: evolución de temas y emociones a lo largo del tratamiento.

## ✅ Verificación Fase 3

- [ ] Confirmar en Google Cloud que las llamadas se facturan (que **no** están cayendo en el free tier).
- [ ] El pipeline completo corre con un audio de prueba y produce un `ClinicalNote` en `BORRADOR`.
- [ ] La salida valida contra el schema Zod **siempre** — correr 10 veces seguidas.
- [ ] Cada afirmación del expediente apunta a un timestamp real del transcript.
- [ ] Meter una frase de riesgo en el audio de prueba y confirmar que la detecta y la marca.
- [ ] `AiAnalysis.costoUsd` coincide con lo estimado (~$0.02). Si no, revisar el tamaño del prompt.
- [ ] Ningún expediente puede quedar `FIRMADA` sin pasar por revisión humana.

---

# FASE 4 — Agenda y recordatorios

## 🛑 PUERTA 4 — Registros que debe hacer el humano

| # | Servicio | Qué hacer | Qué entregar |
|---|---|---|---|
| 1 | **Brevo** — brevo.com | Crear cuenta (300 correos/día gratis) → SMTP & API → credenciales SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| 2 | **Google Cloud Console** *(opcional, solo si se quiere Calendar)* | Nuevo proyecto → habilitar Google Calendar API → OAuth consent screen → credenciales OAuth 2.0 con redirect a `${APP_URL}/api/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| 3 | **Mailtrap** — mailtrap.io *(desarrollo)* | Cuenta gratis, para no mandar correos reales mientras se prueba | `SMTP_*` de desarrollo |

## Tareas

1. `npm i nodemailer && npm i -D @types/nodemailer`
2. `src/lib/mail.ts` — transporter de nodemailer. **Runtime Node obligatorio**, nunca Edge. En desarrollo apunta a Mailtrap.
3. Plantillas de correo en HTML: recordatorio al psicólogo (24 h antes), recordatorio al paciente (24 h antes), aviso de "expediente listo para revisión".
4. Vista de agenda: semana y día, crear/mover/cancelar cita → `Appointment`.
5. Programador: al crear una cita se insertan filas en `Reminder` con `programadoPara`.
6. `GET /api/cron/reminders` (protegido por `WEBHOOK_SECRET`) → envía los `Reminder` vencidos, marca `enviadoEn`. Añadir al workflow de GitHub Actions, cada 15 min.
7. **Cron de retención**: borra de R2 el audio crudo con más de 30 días ya transcrito; conserva transcript y expediente (la NOM exige 5 años). Marca `Recording.borradoEn`.
8. *(Opcional)* OAuth con Google Calendar y sincronización en dos vías con `Appointment.googleEventId`.

## ✅ Verificación Fase 4

- [ ] Crear una cita genera sus `Reminder` con la hora correcta y en la zona horaria correcta.
- [ ] Disparar el cron a mano entrega el correo **en Mailtrap** — jamás a un correo real de paciente durante pruebas.
- [ ] Un `Reminder` ya enviado no se vuelve a enviar si el cron corre dos veces.
- [ ] El cron de retención borra de R2 pero **no** borra transcript ni expediente.

---

# FASE 5 — Pulido

## 🛑 PUERTA 5 — Ninguna

## Tareas

1. Dashboard de evolución del paciente: gráficas de emociones y temas a lo largo del tratamiento (usar `EmotionMetric`).
2. Exportar expediente a PDF, con todas sus versiones y firmas.
3. Búsqueda full-text sobre transcripts y expedientes (`pg_trgm` en Postgres).
4. Panel de administración: usuarios, roles, política de retención, uso y costo de IA por psicólogo.
5. Estados vacíos, estados de carga, manejo de errores, accesibilidad.
6. Revisión de seguridad final contra el checklist de abajo.

## ✅ Verificación Fase 5

- [ ] El PDF exportado incluye historial de versiones y datos de la firma.
- [ ] La prueba de aislamiento de la Fase 1 sigue pasando (correrla de nuevo — es la que más se rompe al agregar features).
- [ ] Lighthouse: accesibilidad ≥ 90.

---

# 🔒 Antes de tocar datos de un paciente real

> Grabar sesiones de psicoterapia produce **datos personales sensibles** bajo la LFPDPPP, y el expediente clínico está regulado por la **NOM-004-SSA3-2012**. Un error aquí no es un bug: es responsabilidad legal para el psicólogo. Que el sistema sea "una prueba" no cambia nada en el momento en que entra audio de una persona real.

Nada de esto es opcional:

- [ ] **Consentimiento informado por escrito** de cada paciente, específico para (a) grabar audio y (b) procesarlo con servicios de IA de terceros. Guardado en `Consent` con evidencia firmada. **La app bloquea la grabación si no hay consentimiento vigente.**
- [ ] **Aviso de privacidad** publicado, nombrando a los encargados: Deepgram, Google (Gemini), Cloudflare, Clerk, Neon, Vercel — y el país donde residen los datos.
- [ ] **Gemini en nivel de pago**, verificado en la consola de facturación.
- [ ] **Deepgram**: activada la opción de no retención y la redacción de PII.
- [ ] **MFA obligatorio** para todos los usuarios.
- [ ] **Política de retención** definida por la clínica y aplicada por el cron.
- [ ] Confirmado que **ningún log contiene contenido clínico**.
- [ ] La UI dice explícitamente que el expediente es generado por IA y requiere revisión profesional.

---

# Referencia rápida Next.js 16.3.1

Verificado leyendo `node_modules/next/dist/docs/`. **Este no es el Next.js de los tutoriales de internet.**

| Cambio | Qué hacer |
|---|---|
| **`middleware.ts` → `proxy.ts`** — exporta `proxy`, corre en Node.js; `runtime: 'edge'` lanza error | Codemod: `npx @next/codemod@canary middleware-to-proxy .` |
| ⚠️ **`proxyClientMaxBodySize` = 10 MB.** Si `proxy.ts` hace match con una ruta de subida, Next bufferea el body y **lo trunca en silencio** — no falla, solo llega incompleto | El `matcher` debe excluir `/api/recordings/**` y `/api/webhooks/**`. Es la trampa más peligrosa de este proyecto |
| Sin `matcher`, `proxy` corre en **cada** request, incluido `_next/static` | `matcher` explícito siempre |
| **APIs dinámicas 100% async** — `cookies()`, `headers()`, `params`, `searchParams` ya no tienen versión síncrona | `const { id } = await params`. Correr `next typegen` → `PageProps<'/pacientes/[id]'>`, `RouteContext<'/api/...'>` |
| **Server Actions**: body de 1 MB y despacho **secuencial** (uno a la vez por cliente) | Nada de subir archivos por Server Action; no paralelizar con `Promise.all` |
| Un Server Action es un **POST público** alcanzable por cualquiera | Autenticar **dentro** de cada acción. Renderizar condicionalmente en un layout **no** es una frontera de seguridad |
| `revalidateTag(tag)` de un argumento **deprecado** → `revalidateTag(tag, profile)`. Nuevos `updateTag()` y `refresh()` | `updateTag` tras firmar un expediente |
| Route Handlers no cacheados por defecto; `params` es `Promise`; sin `bodyParser` | El tope real de subida lo pone Vercel (~4.5 MB), no Next |
| `cacheComponents` (estable en 16, reemplaza `dynamicIO`/`useCache`/`ppr`) | **Dejarlo apagado** — todo dato clínico es dinámico y por usuario |
| `after()` de `next/server` para trabajo post-respuesta | Se usa para disparar Gemini y escribir `AuditLog` sin bloquear |
| `instrumentation.ts` → `register()` + `onRequestError()` | Enganche de Sentry |
| **Removidos**: `next lint`, `serverRuntimeConfig`, `publicRuntimeConfig`, AMP | `package.json` ya usa `"lint": "eslint"` ✅ |
| **Next.js no trae cron** | Por eso se usa GitHub Actions |

La guía oficial `02-guides/authentication.md` respalda el diseño del DAL: `import 'server-only'`, envuelto en `cache()` de React, y *"Proxy no debe ser tu única línea de defensa"* — solo chequeos optimistas de cookie, sin tocar la BDD.

---

# Apéndice A — Modelo de datos

```
Organization      id, clerkOrgId, nombre, zonaHoraria
User              id, clerkUserId, orgId, rol(ADMIN|PSICOLOGO|RECEPCION), cedulaProfesional
Patient           id, orgId, psicologoId, nombre, fechaNacimiento, contacto, estado
Consent           id, patientId, tipo(GRABACION|TRATAMIENTO_IA), otorgadoEn, revocadoEn, evidenciaUrl
Appointment       id, orgId, psicologoId, patientId, inicio, fin, estado, googleEventId
Session           id, appointmentId, patientId, psicologoId, numeroSesion, iniciadaEn
Recording         id, sessionId, r2Key, duracionSeg, bytes, estado, intentos, borradoEn
Transcript        id, recordingId, proveedor, idioma, textoCompleto, confianza
TranscriptSegment id, transcriptId, hablante(PSICOLOGO|PACIENTE), msInicio, msFin, texto
ClinicalNote      id, sessionId, version, estado(BORRADOR|FIRMADA), soapJson, generadaPorIa,
                  editadaPorId, firmadaEn, firmadaPorId          ← append-only
AiAnalysis        id, sessionId, tipo, payloadJson, modelo, tokensIn, tokensOut, costoUsd
EmotionMetric     id, sessionId, etiqueta, puntaje, msInicio
Reminder          id, appointmentId, canal, programadoPara, enviadoEn, estado
AuditLog          id, orgId, actorId, accion, recurso, recursoId, ip, creadoEn
```

Máquina de estados de `Recording`:
```
PENDIENTE → SUBIDO → TRANSCRIBIENDO → TRANSCRITO → ANALIZANDO → LISTO
                          ↓                              ↓
                       FALLIDO ←─── barredor reintenta ──┘
```

---

# Apéndice B — Variables de entorno completas

```env
# Fase 0
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
SENTRY_DSN=

# Fase 2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=psicologia-audio
DEEPGRAM_API_KEY=
APP_URL=
WEBHOOK_SECRET=

# Fase 3
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash

# Fase 4
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

# Apéndice C — Salidas si el costo sube

| Situación | Salida |
|---|---|
| Se acabaron los $200 de Deepgram | `gemini-2.5-flash-lite` acepta audio nativo a ~$0.035/hora — más barato que Deepgram ($0.46/h). Contra: la diarización sale por prompt y es menos confiable. Otra opción: Whisper self-host |
| Gemini sale más caro de lo esperado | Bajar a `gemini-2.5-flash-lite` ($0.10/$0.40 vs $0.75/$3.75). Comparar calidad con las mismas 5 sesiones antes de decidir — por eso el modelo está en variable de entorno |
| Neon free se llena (0.5 GB) | Los transcripts son texto y pesan poco; el audio vive en R2. Alerta al 70%. Plan pagado desde $19/mes |
| R2 free se llena (10 GB ≈ 250 sesiones) | El cron de retención de 30 días debería evitarlo. Si no, $0.015/GB/mes |
| La clínica empieza a cobrar usando el sistema | Vercel Hobby prohíbe uso comercial → Pro ($20/mes) u otro host |

---

# Progreso

- [x] Fase 0 — Cimientos
- [ ] Fase 1 — Expediente manual
- [ ] Fase 2 — Audio → transcripción
- [ ] Fase 3 — IA
- [ ] Fase 4 — Agenda y recordatorios
- [ ] Fase 5 — Pulido
- [ ] Checklist legal completo (obligatorio antes de datos reales)
