"use server";

import { revalidatePath } from "next/cache";

import { invitationSchema, type InvitationInput } from "@/lib/schemas/invitation";
import { inviteMember } from "@/lib/dal/invitations";

export type InvitationActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function inviteMemberAction(
  input: InvitationInput,
): Promise<InvitationActionResult> {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  try {
    await inviteMember(parsed.data);
    revalidatePath("/organizacion/miembros");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo enviar la invitación",
    };
  }
}
