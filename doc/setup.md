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

- Repo conectado a Vercel (branch `main` → deploy automático).
- **Cron**: definido en `vercel.json` (`/api/cron/reminders` cada 15 min).
- Al agregar/quitar variables de entorno en Vercel, hacer **Redeploy**.
- El webhook de Clerk apunta a
  `https://psicologysystem.vercel.app/api/webhooks/clerk`.
