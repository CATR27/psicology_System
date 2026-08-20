# Sistema de Expedientes Clínicos con IA — Documentación

> **📌 Regla obligatoria:** todo cambio en el proyecto (código, infraestructura,
> base de datos, servicios, variables de entorno, o decisiones de negocio) **se
> documenta en esta carpeta**. Si tocas algo y estos documentos no lo reflejan,
> actualízalos en el mismo cambio. Cualquier persona debe poder abrir esta carpeta
> y entender **el estado actual del proyecto, su infraestructura y en qué va**.

## Qué es

Sistema de expedientes clínicos para una clínica de psicología con varios
psicólogos. El psicólogo registra pacientes, lleva su **historia clínica**, llena
un **formato de consulta** en cada sesión, agenda **citas** con **recordatorios
por correo**, y exporta todo a **PDF**. Está planeado que grabe audio, lo
transcriba y lo analice con IA (pendiente).

**Stack:** Next.js 16.3.1 (App Router), React 19, TypeScript, Tailwind 4,
shadcn/ui, Prisma 7, PostgreSQL (Neon), Clerk (auth), Sentry (monitoreo),
nodemailer (correo).

## Índice

| Documento | Contenido |
|---|---|
| [CONTINUAR.md](CONTINUAR.md) | **Handoff para otra IA**: en qué quedamos, reglas y qué sigue. |
| [estado.md](estado.md) | Estado actual por fase, funcionalidad construida, roadmap pendiente. |
| [infraestructura.md](infraestructura.md) | Servicios usados, servicios futuros, variables de entorno. |
| [arquitectura.md](arquitectura.md) | Estructura del proyecto, decisiones clave, flujos, seguridad. |
| [modelo-datos.md](modelo-datos.md) | Tablas de la base de datos. |
| [setup.md](setup.md) | Cómo correr localmente y desplegar. |

---

*Última actualización: cierre de Fase 0 y Fase 1, y avance de Fase 4 (agenda +
recordatorios por Gmail).*
