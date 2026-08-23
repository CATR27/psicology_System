"use client";

import { SignUp } from "@clerk/nextjs";

import { authAppearance } from "@/components/auth/clerk-appearance";
import { useVeraTheme } from "@/components/auth/use-vera-theme";
import { VeraAuthShell } from "@/components/auth/vera-auth-shell";

export function VeraSignUp() {
  const { theme, toggle } = useVeraTheme();

  return (
    <VeraAuthShell theme={theme} onToggleTheme={toggle}>
      <SignUp appearance={authAppearance(theme, { showFooter: true })} />
    </VeraAuthShell>
  );
}
