# Estado actual del proyecto

## Por fase

| Fase | Estado | Detalle |
|---|---|---|
| Fase 0 — Cimientos | ✅ Terminada | Auth (Clerk + organizaciones), base de datos, proxy, Sentry, webhook de sincronización, deploy en Vercel. |
| Fase 1 — Expediente manual | ✅ Terminada | CRUD de pacientes, sesiones, consentimientos, auditoría, aislamiento por org/psicólogo. |
| Fase 2 — Audio → transcripción | ✅ Terminada | Grabador en navegador (MediaRecorder), subida multipart directa a R2 (URLs prefirmadas, nunca pasa por Next), transcripción con Deepgram (nova-3, es, diarización + utterances), webhook de callback, visor de transcript con burbujas y reasignar hablante, barredor de reintentos (`/api/cron/sweep`). Probado con audio real de punta a punta. |
| Fase 3 — IA | 🟡 Parcial | Botón **"Generar con IA"** (manual, no automático) en el editor de la consulta: llama a Gemini (`gemini-3.1-flash-lite`, nivel de pago) con la transcripción y llena el formulario de sesión (5 campos + señales de riesgo aparte) — el psicólogo revisa y guarda él mismo, nunca se autoguarda ni se firma sola. Banner dedicado y siempre visible de señales de riesgo (editor, vista firmada y PDF). Reproductor de audio en la sesión + **fuentes citadas con timestamp** (clic → salta y reproduce ese momento exacto), también en las burbujas del transcript. **Corregir una fuente** (edición inline) dispara una revisión parcial con Gemini — solo actualiza los campos que de verdad se ven afectados por esa corrección, deja el resto del borrador intacto (no regenera todo). Memoria **"JesIA"** por psicólogo: notas de estilo/corrección que se inyectan al prompt en generaciones futuras, aisladas por psicólogo. **Evolución del paciente** (`/pacientes/[id]/evolucion`): timeline cronológico por sesión con clima afectivo, temas y señales de riesgo — ver nota abajo. Falta: historia clínica (descartado — se decidió mantenerla 100% manual). |
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
> **Simplificación consciente vs. el plan**: ambas cosas que faltaban ya se
> hicieron — panel dedicado de señales de riesgo y citas a timestamps (ver
> notas abajo). Lo único que queda de la lista original del plan es la
> comparación de evolución entre sesiones.

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

## Nota sobre el reproductor de audio y las fuentes citadas

> No existía forma de escuchar la grabación en la app (solo leer texto).
> Se agregó `getPlaybackUrls` (URL prefirmada de R2, generada una sola vez
> por carga de página — **no** en cada tick del polling, o el `<audio>` se
> reiniciaría solo). `src/lib/audio-seek.ts` expone un mecanismo simple
> por `id` de elemento DOM (`session-audio`) para saltar a un timestamp
> desde cualquier componente sin context ni prop-drilling — lo usan tanto
> las burbujas del transcript como las "fuentes" del formato de sesión.
>
> Gemini ahora recibe cada línea con su timestamp (`[mm:ss] hablante:
> texto`) y devuelve `fuentes: {texto, timestamp}[]` citando de dónde
> sacó cada afirmación clave. **Bug real encontrado en la prueba antes de
> desplegar**: el modelo devolvía el timestamp con corchetes
> (`"[02:08]"`), rompiendo el parseo en silencio — se limpia con regex en
> dos capas (server al recibir la respuesta, cliente al parsear) y el
> prompt pide explícitamente el formato sin corchetes.

## Nota sobre corrección puntual de una fuente

> Cada fuente tiene un botón "corregir" (edición inline). El texto corregido
> se aplica de una al form — es determinístico, el psicólogo está afirmando
> qué se dijo de verdad, no depende de que la IA responda bien. Aparte, se
> le pide a Gemini una segunda opinión con `reviseFormatoSesion` (nuevo en
> `src/lib/ai/gemini.ts`): schema con **nada obligatorio** (`required: []`),
> le mandamos el fragmento antes/después + el contenido actual de los 6
> campos, y devuelve **solo** las claves que de verdad cambian (por
> presencia de clave, no por truthiness — así se distingue "no cambió,
> omitido" de "cambió y ahora está vacío"). El cliente hace `setValue` solo
> en esas claves — el resto del borrador queda intacto, no es una
> regeneración completa. Probado con Gemini real antes de conectar la UI:
> una corrección con impacto real devolvió solo la clave afectada; una
> corrección cosmética devolvió `{}`.
>
> **Fuera de alcance a propósito**: no se corrige `TranscriptSegment.texto`
> en BD — el transcript maestro queda igual, solo se corrige la nota
> derivada de él. Emparejar una fuente con su segmento exacto por string de
> timestamp es frágil; si hace falta más adelante, guardar `segmentId` en
> cada fuente al generar sería el camino.

## Nota sobre "Evolución del paciente"

> Timeline cronológico por sesión en `/pacientes/[id]/evolucion` (entrada
> desde una card nueva en la página del paciente): clima afectivo (badges,
> partiendo el string libre por comas — no hay lista blanca de los 8 chips
> conocidos, texto libre se muestra igual), extracto de temas centrales
> (`line-clamp-2`) y una barra simple de señales de riesgo (conteo +
> ancho relativo al máximo de la lista, con piso `Math.max(1, ...)` para no
> dividir por cero si todas las sesiones tienen 0). Una sola query
> (`listPatientEvolution` en `notes.ts`, mismo patrón `include`+`take:1`
> que `listSessions`), sin N+1.
>
> **Decisión explícita del usuario**: no usar el modelo `EmotionMetric`
> (queda sin usar en el schema — es por-timestamp de audio, no calza con
> "comparar sesiones"), no agregar una llamada nueva a Gemini, no inventar
> un puntaje numérico de ánimo/riesgo con IA, no agregar librería de
> gráficas — se comparó contra esas alternativas y se descartaron. Todo
> sale de datos que el psicólogo ya capturó al llenar/generar la nota de
> cada sesión.

## Nota sobre organizaciones e invitaciones (modelo cerrado)

> **Decisión explícita del usuario**: nadie se auto-registra creando una
> organización nueva. Una organización (clínica) se crea manualmente por
> ahora (fuera de la app, vía Clerk Dashboard); todo psicólogo entra
> exclusivamente por invitación.
>
> - Página `/organizacion/miembros` (solo admin, `ctx.rol === "ADMIN"`):
>   lista miembros de la org (query directa a `User`, ya sincronizado) y un
>   form para invitar por correo (`src/lib/dal/invitations.ts` →
>   `clerkClient().organizations.createOrganizationInvitation`). Clerk manda
>   el correo con su propia plantilla — no usa el mailer de Brevo/Gmail del
>   proyecto. Rol se manda como `org:member` (Psicólogo) / `org:recepcion`
>   (Recepción) / `org:admin` (Admin), mismo mapeo que `mapRole()` en
>   `src/lib/dal/sync.ts`.
> - El link de invitación de Clerk (`__clerk_ticket`) hace, por default, que
>   `<SignUp>` una la cuenta nueva a la org del ticket y la deje activa en
>   sesión — comportamiento nativo de Clerk, no se tocó `sign-up/page.tsx`.
> - Se quitó `<SignUpButton>` del nav y de la landing (`src/app/page.tsx`):
>   con modelo cerrado no se invita a nadie a auto-registrarse.
> - **Pendiente de confirmar en Clerk Dashboard (no es código)**: "Personal
>   accounts" desactivado (si no, alguien puede registrarse sin org y queda
>   con sesión pero sin fila `User` en BD — `syncUserFromEvent` es un no-op
>   sin membresía), sign-up restringido a invitación, y que los roles custom
>   `org:admin`/`org:recepcion` existan en el dashboard.
>
> **1 org por usuario, sin excepción**: `User.orgId` es un escalar
> obligatorio (no hay tabla de membresías). Si Clerk llegara a mandar una
> segunda membresía de una org distinta para el mismo usuario,
> `syncUserFromMembership`/`syncUserFromEvent` (`src/lib/dal/sync.ts`) ya NO
> sobrescriben `orgId` en silencio — la rechazan (`rejectIfConflictingOrg`,
> gana la primera org sincronizada) y reportan la anomalía a Sentry
> (`captureMessage`, solo IDs, sin PII). El `<OrganizationSwitcher>` del nav
> se reemplazó por el nombre de la org de solo lectura — no hay forma de
> crear ni cambiar de org desde la UI.
>
> **`requireContext` ya no manda a `/sign-in` en silencio**: si el usuario
> está logueado pero sin `orgId` activo, o si `Organization`/`User` aún no
> están sincronizados (carrera con el webhook), redirige a
> `/sin-organizacion` con un mensaje explicando qué pasa y botón de
> recargar/cerrar sesión.

## Roadmap pendiente

1. **Fase 3 restante** — registrar costo real por sesión (`AiAnalysis`).
2. **Fase 4 restante (opcional)** — Sincronización con Google Calendar.
3. **Fase 5** — Dashboard de evolución, búsqueda full-text, panel de administración, accesibilidad.
4. **Legal** — Aviso de privacidad, consentimiento firmado, MFA obligatorio,
   Gemini en nivel de pago (✅ ya activado), Deepgram sin retención —
   **antes de tocar datos reales**.
