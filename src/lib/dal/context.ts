import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export type Ctx = {
  userId: string;
  orgId: string;
  rol: Role;
  clerkUserId: string;
  clerkOrgId: string;
};

export const requireContext = cache(async (): Promise<Ctx> => {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/sin-organizacion?motivo=sin-org-activa");

  const [org, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, rol: true },
    }),
  ]);

  if (!org || !user) redirect("/sin-organizacion?motivo=sincronizando");

  return {
    userId: user.id,
    orgId: org.id,
    rol: user.rol,
    clerkUserId: userId,
    clerkOrgId: orgId,
  };
});
