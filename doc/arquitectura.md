# Arquitectura

## Estructura del proyecto

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

## Decisiones clave

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

## Flujos principales

1. **Registro/login** → Clerk crea usuario + organización → el webhook los
   sincroniza en la BDD.
2. **Paciente** → crear/editar → dashboard con cards.
3. **Historia clínica** → wizard de 11 secciones, autosave y % de progreso.
4. **Consulta** → sesión → formato de consulta → firmar (append-only) → PDF.
5. **Agenda** → crear cita (paciente + fecha/hora) → genera recordatorios →
   el cron envía correos **solo al psicólogo** (24h y 1h antes). El paciente
   no recibe correo (decisión de producto). Reprogramar/cancelar desde el
   modal de detalle recalcula/borra los recordatorios pendientes.

## Seguridad (invariantes)

- Aislamiento por `orgId` + `psicologoId` en **toda** query de datos de paciente.
- Notas de consulta **append-only** (nunca `UPDATE` destructivo).
- Todo lo generado por IA nacerá en `BORRADOR` y requerirá revisión humana.
- Cero contenido clínico en logs (Sentry filtra con `beforeSend`).
- Consentimiento informado obligatorio antes de grabar/procesar datos reales.
