"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import { getSessionDirty } from "@/lib/session-dirty";

export function LeaveSessionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (getSessionDirty()) {
      const ok = confirm(
        "¿Salir de la sesión? No se guardará nada. Podrás retomarla después o borrarla.",
      );
      if (!ok) e.preventDefault();
    }
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
