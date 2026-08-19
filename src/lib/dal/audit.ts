import "server-only";

import { prisma } from "@/lib/prisma";

import type { Ctx } from "./context";

export async function audit(
  ctx: Pick<Ctx, "orgId" | "userId">,
  accion: string,
  recursoId?: string,
) {
  const recurso = accion.split(".")[0];
  await prisma.auditLog.create({
    data: {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      accion,
      recurso,
      recursoId: recursoId ?? null,
    },
  });
}
