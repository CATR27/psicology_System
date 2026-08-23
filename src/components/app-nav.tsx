"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  UserButton,
  useAuth,
  useOrganization,
} from "@clerk/nextjs";

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
          <Link href="/" className="font-semibold tracking-tight">
            Expedientes Clínicos
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
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </SignInButton>
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
