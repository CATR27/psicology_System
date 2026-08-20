# Cómo correr localmente y desplegar

## Local

```bash
# 1. Instalar dependencias (genera el cliente de Prisma)
npm install

# 2. Configurar .env.local (ver infraestructura.md)

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

## Despliegue (Vercel)

- Repo conectado a Vercel (branch `main` → deploy automático al hacer push).
- **NO usar `vercel.json` con `crons`** (rompe el deploy en Hobby). El cron de
  recordatorios se maneja con **GitHub Actions** (`.github/workflows/reminders.yml`).
- Al agregar/quitar variables de entorno en Vercel, hacer **Redeploy**.
- Requiere el **secreto `CRON_SECRET` en GitHub** (Settings → Secrets → Actions)
  para que el workflow llame a `/api/cron/reminders`.
- El webhook de Clerk apunta a
  `https://psicologysystem.vercel.app/api/webhooks/clerk`.

## Cron (recordatorios)

- Workflow: `.github/workflows/reminders.yml`
- Frecuencia: cada 15 min (`*/15 * * * *`) + disparo manual (`workflow_dispatch`).
- Llama a `https://psicologysystem.vercel.app/api/cron/reminders` con
  `Authorization: Bearer ${{ secrets.CRON_SECRET }}`.
