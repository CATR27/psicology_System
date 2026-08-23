"use client";

import { SignIn } from "@clerk/nextjs";

import { authAppearance } from "@/components/auth/clerk-appearance";
import { useVeraTheme } from "@/components/auth/use-vera-theme";
import { VeraAuthShell } from "@/components/auth/vera-auth-shell";

export function VeraSignIn() {
  const { theme, toggle } = useVeraTheme();

  return (
    <VeraAuthShell theme={theme} onToggleTheme={toggle}>
      <SignIn appearance={authAppearance(theme, { showFooter: false })} />
      <p className="invite-note">
        El acceso es solo por invitación de tu clínica. ¿Problemas para entrar?
      </p>
    </VeraAuthShell>
  );
}
