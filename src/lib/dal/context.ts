import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const requireContext = cache(async () => {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/sign-in");
  return { userId, orgId, orgRole };
});
