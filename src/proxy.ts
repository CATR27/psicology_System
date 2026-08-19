import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // CRÍTICO: excluye subidas y webhooks, o Next trunca los bodies en silencio
    "/((?!_next|api/recordings|api/webhooks|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
