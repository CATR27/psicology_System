"use client";

import Link from "next/link";
import { Show, UserButton, useAuth, useOrganization } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

function OrgName() {
  const { organization } = useOrganization();
  if (!organization) return null;
  return (
    <span className="text-sm text-muted-foreground">{organization.name}</span>
  );
}

function MiembrosLink() {
  const { orgRole } = useAuth();
  if (orgRole !== "org:admin") return null;
  return (
    <Link href="/organizacion/miembros" className="text-muted-foreground hover:text-foreground">
      Miembros
    </Link>
  );
}

export function AppNav() {
  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 h-14 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-[8px] text-sm font-semibold"
              style={{
                fontFamily: "var(--brand-font-display)",
                color: "var(--brand-accent)",
                background: "color-mix(in oklch, var(--brand-accent) 18%, var(--brand-surface))",
                border: "1px solid color-mix(in oklch, var(--brand-accent) 35%, var(--brand-border))",
              }}
            >
              V
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Vera
            </span>
          </Link>
          <Show when="signed-in">
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/pacientes" className="text-muted-foreground hover:text-foreground">
                Pacientes
              </Link>
              <Link href="/agenda" className="text-muted-foreground hover:text-foreground">
                Agenda
              </Link>
              <MiembrosLink />
            </nav>
          </Show>
        </div>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Button
              render={<Link href="/sign-in" />}
              size="sm"
              className="rounded-full border-0"
              style={{
                background: "var(--brand-accent)",
                color: "var(--brand-on-accent)",
              }}
            >
              Iniciar sesión
            </Button>
          </Show>
          <Show when="signed-in">
            <OrgName />
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
