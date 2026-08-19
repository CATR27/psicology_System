import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import {
  deleteOrganization,
  deleteUser,
  syncOrganization,
  syncUserFromEvent,
  syncUserFromMembership,
  type MembershipUserInput,
} from "@/lib/dal/sync";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error(
      "Firma de webhook inválida",
      err instanceof Error ? err.message : err,
    );
    return new Response("Webhook verification failed", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "organization.created":
      case "organization.updated": {
        const data = evt.data as {
          id: string;
          name?: string | null;
          slug?: string | null;
        };
        await syncOrganization(data);
        break;
      }
      case "organization.deleted": {
        const data = evt.data as { id: string };
        await deleteOrganization(data.id);
        break;
      }
      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const data = evt.data as {
          role?: string | null;
          organization?: {
            id?: string | null;
            name?: string | null;
          } | null;
          public_user_data?: MembershipUserInput | null;
        };
        const orgId = data.organization?.id;
        const pu = data.public_user_data;
        if (orgId && pu?.user_id) {
          await syncUserFromMembership(
            { id: orgId, name: data.organization?.name },
            pu,
            data.role ?? null,
          );
        }
        break;
      }
      case "organizationMembership.deleted": {
        const data = evt.data as {
          public_user_data?: { user_id?: string | null } | null;
        };
        if (data.public_user_data?.user_id) {
          await deleteUser(data.public_user_data.user_id);
        }
        break;
      }
      case "user.created":
      case "user.updated": {
        await syncUserFromEvent(
          evt.data as Parameters<typeof syncUserFromEvent>[0],
        );
        break;
      }
      case "user.deleted": {
        const data = evt.data as { id: string };
        await deleteUser(data.id);
        break;
      }
      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(
      "Error procesando webhook",
      err instanceof Error ? err.message : err,
    );
    return new Response("Internal error", { status: 500 });
  }
}
