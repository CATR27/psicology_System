import "server-only";

import * as Sentry from "@sentry/nextjs";

import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

function mapRole(clerkRole: string | null | undefined): Role {
  if (clerkRole === "admin" || clerkRole === "org:admin") return "ADMIN";
  if (clerkRole === "recepcion" || clerkRole === "org:recepcion") {
    return "RECEPCION";
  }
  return "PSICOLOGO";
}

export type OrgSyncInput = {
  id: string;
  name?: string | null;
  slug?: string | null;
};

export type MembershipUserInput = {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  identifier?: string | null;
};

export type UserEventInput = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: { email_address?: string | null }[] | null;
  organization_memberships?: {
    organization?: { id?: string | null } | null;
    role?: string | null;
  }[] | null;
};

export async function syncOrganization(input: OrgSyncInput) {
  const nombre = input.name ?? input.slug ?? "Clínica";
  return prisma.organization.upsert({
    where: { clerkOrgId: input.id },
    create: { clerkOrgId: input.id, nombre },
    update: { nombre },
  });
}

export async function syncUserFromMembership(
  clerkOrg: { id: string; name?: string | null },
  user: MembershipUserInput,
  role: string | null,
) {
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: clerkOrg.id },
    create: { clerkOrgId: clerkOrg.id, nombre: clerkOrg.name ?? "Clínica" },
    update: {},
  });

  const conflict = await rejectIfConflictingOrg(user.user_id, org.id);
  if (conflict) return conflict;

  const nombre = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return prisma.user.upsert({
    where: { clerkUserId: user.user_id },
    create: {
      clerkUserId: user.user_id,
      orgId: org.id,
      rol: mapRole(role),
      nombre: nombre || null,
      email: user.identifier ?? null,
    },
    update: {
      orgId: org.id,
      rol: mapRole(role),
      nombre: nombre || undefined,
      email: user.identifier ?? undefined,
    },
  });
}

export async function syncUserFromEvent(user: UserEventInput) {
  const nombre = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const email =
    user.email_addresses?.find((e) => e.email_address)?.email_address ?? null;

  const membership = user.organization_memberships?.find(
    (m) => m.organization?.id,
  );

  if (!membership?.organization?.id) {
    // Usuario sin organización aún: no se puede crear User (orgId obligatorio).
    // Se creará cuando llegue organizationMembership.created.
    return null;
  }

  const org = await prisma.organization.upsert({
    where: { clerkOrgId: membership.organization.id },
    create: { clerkOrgId: membership.organization.id, nombre: "Clínica" },
    update: {},
  });

  const conflict = await rejectIfConflictingOrg(user.id, org.id);
  if (conflict) return conflict;

  return prisma.user.upsert({
    where: { clerkUserId: user.id },
    create: {
      clerkUserId: user.id,
      orgId: org.id,
      rol: mapRole(membership.role),
      nombre: nombre || null,
      email,
    },
    update: {
      orgId: org.id,
      rol: mapRole(membership.role),
      nombre: nombre || undefined,
      email: email ?? undefined,
    },
  });
}

/**
 * Modelo de la app: 1 org por usuario (User.orgId es escalar, sin tabla de
 * membresías). Si Clerk manda una membresía de una org distinta a la que el
 * usuario ya tiene en BD, no se sobrescribe en silencio — se rechaza y se
 * reporta la anomalía. La primera org que sincronizó gana.
 */
async function rejectIfConflictingOrg(clerkUserId: string, incomingOrgId: string) {
  const existing = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, orgId: true, clerkUserId: true },
  });
  if (!existing || existing.orgId === incomingOrgId) return null;

  Sentry.captureMessage("Membresía de organización en conflicto rechazada", {
    level: "warning",
    extra: {
      clerkUserId,
      orgIdExistente: existing.orgId,
      orgIdEntrante: incomingOrgId,
    },
  });
  return existing;
}

export async function deleteUser(clerkUserId: string) {
  await prisma.user.deleteMany({ where: { clerkUserId } });
}

export async function deleteOrganization(clerkOrgId: string) {
  await prisma.organization.deleteMany({ where: { clerkOrgId } });
}
