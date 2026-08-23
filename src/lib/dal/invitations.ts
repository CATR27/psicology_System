import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { InvitationInput } from "@/lib/schemas/invitation";

import { requireContext } from "./context";
import { audit } from "./audit";

export async function listOrgMembers() {
  const ctx = await requireContext();
  if (ctx.rol !== "ADMIN") notFound();
  return prisma.user.findMany({
    where: { orgId: ctx.orgId },
    orderBy: { creadaEn: "asc" },
    select: { id: true, nombre: true, email: true, rol: true },
  });
}

export async function inviteMember(input: InvitationInput) {
  const ctx = await requireContext();
  if (ctx.rol !== "ADMIN") {
    throw new Error("Solo un administrador puede invitar miembros");
  }

  const client = await clerkClient();
  await client.organizations.createOrganizationInvitation({
    organizationId: ctx.clerkOrgId,
    emailAddress: input.email,
    role: input.rol,
    inviterUserId: ctx.clerkUserId,
    redirectUrl: `${process.env.APP_URL}/sign-up`,
  });

  await audit(ctx, "member.invite");
}
