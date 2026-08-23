import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Solo se excluyen webhooks/cron (no llevan sesión de Clerk, usan su
    // propio secreto). api/recordings SÍ pasa por Clerk: esas rutas solo
    // mandan JSON chico, el audio va directo del navegador a R2.
    "/((?!_next|api/webhooks|api/cron|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
