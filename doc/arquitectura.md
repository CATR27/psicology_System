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

1. **Registro/login (modelo cerrado, solo invitación)** → nadie se
   auto-registra creando una organización nueva. Un admin crea una
   organización (clínica) por ahora fuera de la app; invita psicólogos desde
   `/organizacion/miembros` (server action `inviteMember`, API de Clerk
   `createOrganizationInvitation`); el invitado acepta el link → Clerk lo une
   a esa org y la deja activa en sesión → el webhook sincroniza `User` en la
   BDD **solo cuando ya hay membresía de org** (el evento `user.created` sin
   org es un no-op, ver `syncUserFromEvent`). Si `requireContext` no
   encuentra `orgId` activo o el `User`/`Organization` aún no están
   sincronizados, redirige a `/sin-organizacion` (no a `/sign-in`, para no
   generar un loop confuso a alguien ya logueado). Ver "Nota sobre
   organizaciones e invitaciones" en `doc/estado.md`.
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
