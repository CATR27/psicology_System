# Estado actual del proyecto

## Por fase

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ✅ Terminada | Grabador en navegador (MediaRecorder), subida multipart directa a R2 (URLs prefirmadas, nunca pasa por Next), transcripción con Deepgram (nova-3, es, diarización + utterances), webhook de callback, visor de transcript con burbujas y reasignar hablante, barredor de reintentos (`/api/cron/sweep`). Probado con audio real de punta a punta. |
| Fase 3 — IA | 🟡 Parcial | Botón **"Generar con IA"** (manual, no automático) en el editor de la consulta: llama a Gemini (`gemini-3.1-flash-lite`, nivel de pago) con la transcripción y llena el formulario de sesión (5 campos + señales de riesgo aparte) — el psicólogo revisa y guarda él mismo, nunca se autoguarda ni se firma sola. Banner dedicado y siempre visible de señales de riesgo (editor, vista firmada y PDF). Memoria **"JesIA"** por psicólogo: notas de estilo/corrección que se inyectan al prompt en generaciones futuras, aisladas por psicólogo. Falta: citar timestamps por afirmación, comparación de evolución entre sesiones, historia clínica (descartado — se decidió mantenerla 100% manual). |
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
> **Botón manual, no disparo automático**: el plan original pedía encadenar
> Gemini automáticamente en el webhook de Deepgram (`after()` tras guardar
> el transcript). Se probó así y falló en un caso real — el transcript se
> guardó bien pero la nota nunca se creó, sin error visible; sospecha
> fuerte de que la función serverless de Vercel cortó a la mitad (Gemini +
> las escrituras a BD dentro del mismo request del webhook, que tiene
> límite de tiempo corto). Se cambió a un botón que el psicólogo presiona
> explícitamente — llena el formulario en el cliente, no autoguarda. Más
> confiable (fuera del ciclo de vida del webhook) y le da control al
> psicólogo sobre cuándo generar.
>
> **Simplificación consciente vs. el plan**: el plan pedía citar el
> timestamp de cada afirmación — eso sigue pendiente. El panel dedicado de
> señales de riesgo **ya se hizo** (ver nota abajo).

## Nota sobre indicadores "generado por IA" (decisión explícita del usuario)

> ⚠️ El plan pide que **la UI siempre diga** cuándo algo lo generó la IA
> (requisito de transparencia, relevante para NOM-004). Se avisó esto
> explícitamente y el usuario pidió quitar **todos** los indicadores
> visibles igual (banner, hint, etiqueta en historial). Se respetó la
> decisión, pero el campo `generadaPorIa` **se sigue guardando en BD**
> como rastro interno — no se mostró en UI, no se borró el dato. Si
> hace falta reactivar la transparencia visual más adelante, el dato
> ya está ahí.

## Nota sobre "JesIA" (memoria por psicólogo)

> Modelo `AiMemoryNote` (`psicologoId`, `texto`) — notas libres que cada
> psicólogo agrega ("sé más breve", "tono más cálido", etc.). Al generar
> con IA, se inyectan al prompt de Gemini como "preferencias de estilo",
> con una línea explícita en el prompt de que **nunca** pueden anular
> las reglas de seguridad (no diagnosticar, señales de riesgo siempre
> visibles) — mitiga que una nota de estilo mal escrita silencie una
> señal de riesgo real. Aisladas por `psicologoId`: un psicólogo nunca ve
> ni usa las notas de otro, aunque compartan organización.

## Nota sobre el banner de señales de riesgo

> `senalesRiesgo: string[]` es ahora su propio campo en el schema del
> formato de sesión (antes iba mezclado como texto dentro de
> "observaciones"). Visible en 3 lugares: caja roja editable en el editor,
> banner rojo en la vista firmada (permanece después de firmar, no solo
> durante edición), y primero en el PDF exportado. Gemini lo llena
> aparte al generar; instrucción explícita de no inventar una señal si no
> hay evidencia real en la transcripción.

## Roadmap pendiente

1. **Fase 3 restante** — citar timestamps por afirmación, comparación de
   evolución entre sesiones (`EmotionMetric`), registrar costo real
   (`AiAnalysis`).
2. **Fase 4 restante (opcional)** — Sincronización con Google Calendar.
3. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
4. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago (✅ ya activado), Deepgram sin retención —
   **antes de tocar datos reales**.
