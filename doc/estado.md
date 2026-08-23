# Estado actual del proyecto

## Por fase

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ✅ Terminada | Grabador en navegador (MediaRecorder), subida multipart directa a R2 (URLs prefirmadas, nunca pasa por Next), transcripción con Deepgram (nova-3, es, diarización + utterances), webhook de callback, visor de transcript con burbujas y reasignar hablante, barredor de reintentos (`/api/cron/sweep`). Probado con audio real de punta a punta. |
| Fase 3 — IA | 🟡 Parcial | Al terminar de transcribir, Gemini (`gemini-3.1-flash-lite`, nivel de pago) llena el formato de sesión (5 campos existentes) y crea la nota en `BORRADOR` automático — nunca se firma sola. Probado con transcript real. Falta: banner dedicado de señales de riesgo (por ahora van dentro de "observaciones"), citar timestamps por afirmación, comparación de evolución entre sesiones. |
| Fase 4 — Agenda y recordatorios | ✅ Terminada | Agenda (calendario mes/semana), citas (crear/cancelar/reprogramar), recordatorios por correo (Gmail) **solo al psicólogo** (24h y 1h antes). Cron cada 15 min: cron-job.org (primario) + GitHub Actions (respaldo). |
| Fase 5 — Pulido | 🟡 Parcial | Exportación a PDF básica hecha. Falta: dashboard de evolución, búsqueda, admin. |

## Funcionalidad construida (más allá del plan original)

- **Dashboard del paciente** con cards (historia clínica, nueva consulta, agenda).
- **Historia Clínica** (formato UAQ, 11 secciones, todo opcional) con autosave,
  % de progreso y exportación a PDF.
- **Formato de Sesión** (formato UAQ: objetivo, temas, señalamientos, clima
  afectivo con chips, observaciones) con versionado append-only y firma.
- **Agenda** con calendario (vista mes/semana), creación/cancelación/reprogramación
  de citas (modal de detalle) y recordatorios por correo al psicólogo, con
  diseño profesional (HTML con marca de la clínica).
- **Borrar sesión** y **alerta al salir** de una sesión sin guardar.
- **Grabador de audio + transcripción** en `/sesiones/[id]`: bloquea si no
  hay consentimiento de GRABACION vigente, medidor de nivel, subida
  resiliente por partes (~5MB c/u, mínimo real de R2), visor de transcript
  editable por hablante.

## Nota sobre el deploy (importante para quien continúe)

> ⚠️ El archivo `vercel.json` con `crons` **rompía el deploy en Vercel Hobby**
> (no se creaba el deployment). Se eliminó. **No volver a agregar
> `vercel.json` con `crons`** salvo que el proyecto suba a un plan que lo soporte.

## Nota sobre el cron de recordatorios

> ⚠️ El `schedule` de **GitHub Actions es "best-effort"** — sin garantía de
> horario (documentado por GitHub; en pruebas reales tardó 1h+ sin disparar
> ni una vez solo). Se agregó **cron-job.org** como trigger primario contra
> `/api/cron/reminders` (scheduler externo dedicado, confiable); GitHub
> Actions se dejó como respaldo. El endpoint es idempotente, así que tener
> dos triggers no duplica envíos. Ver `infraestructura.md`.

## Nota sobre recordatorios (cambio de regla)

> Se decidió **no recordar al paciente por correo**, solo al psicólogo (24h y
> 1h antes). Se quitó el checkbox y la lógica de generación del recordatorio
> al paciente (`PACIENTE_DIA_ANTES`). El tipo de recordatorio sigue existiendo
> en el enum de Prisma por las filas históricas ya enviadas, pero ya no se
> generan filas nuevas de ese tipo.

## Nota sobre el proxy de Clerk (importante para quien continúe)

> ⚠️ El plan original decía excluir `api/recordings` del matcher de
> `proxy.ts` (para no truncar subidas grandes). **No aplica** con subida
> directa navegador→R2: esas rutas solo mandan JSON chico, nunca los bytes
> del audio. Excluirlas rompe `auth()` de Clerk ("Clerk: auth() was called
> but Clerk can't detect usage of clerkMiddleware()") — visto en real. El
> matcher solo excluye `api/webhooks` y `api/cron` (sin sesión de Clerk,
> usan su propio secreto).

## Nota sobre Fase 3 (decisiones tomadas)

> **Modelo**: `gemini-3.1-flash-lite` en vez del `gemini-3.7-flash` del plan
> original — generación 3.x a precio de tier lite ($0.25/$1.50 por 1M
> tokens vs $0.75/$3.75), balance costo/razonamiento a este volumen
> (~$0.004/sesión). Si la calidad de detección de riesgo no convence,
> subir a `gemini-3.7-flash` es solo cambiar `GEMINI_MODEL`.
>
> **`store: false`** en la llamada a `interactions.create` — por defecto la
> Interactions API de Gemini guarda el intercambio del lado de Google
> (`store: true`); con datos clínicos sensibles eso no es aceptable, se
> desactivó explícitamente.
>
> **No pisa notas existentes**: si el psicólogo ya empezó una nota a mano
> antes de que termine la transcripción, la IA no genera nada (evita
> conflictos de versión silenciosos). Solo auto-genera la versión 1 si no
> hay ninguna nota todavía.
>
> **Simplificación consciente vs. el plan**: el plan pedía citar el
> timestamp de cada afirmación y un panel dedicado y siempre visible para
> señales de riesgo. Por ahora las señales de riesgo van como texto al
> inicio de "observaciones" (visible, pero no un componente propio) y no
> hay citas a timestamps. Pendiente si se necesita más adelante.

## Roadmap pendiente

1. **Fase 3 restante** — banner dedicado de señales de riesgo, citas a
   timestamps, comparación de evolución entre sesiones (`EmotionMetric`).
2. **Fase 4 restante (opcional)** — Sincronización con Google Calendar.
3. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
4. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago (✅ ya activado), Deepgram sin retención —
   **antes de tocar datos reales**.
