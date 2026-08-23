import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SinOrganizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;

  const mensaje =
    motivo === "sincronizando"
      ? "Tu cuenta ya tiene una organización asignada, pero todavía se está sincronizando. Esto puede tardar unos segundos tras aceptar una invitación."
      : "Tu cuenta no está ligada a ninguna organización todavía.";

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 space-y-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Sin organización
          </h1>
          <p className="text-sm text-muted-foreground">{mensaje}</p>
          <p className="text-sm text-muted-foreground">
            Si acabas de aceptar una invitación, recarga la página. Si no,
            contacta a tu clínica para que te invite.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/sin-organizacion">
              <Button>Recargar</Button>
            </Link>
            <SignOutButton>
              <Button variant="ghost">Cerrar sesión</Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
