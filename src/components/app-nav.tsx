import Link from "next/link";
import {
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

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
            <SignUpButton mode="modal">
              <Button size="sm">Registrarse</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <OrganizationSwitcher />
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
