"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { revokeConsentAction } from "@/app/actions/consents";
import { Button } from "@/components/ui/button";

export function RevokeConsentButton({
  consentId,
  patientId,
}: {
  consentId: string;
  patientId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRevoke() {
    if (!confirm("¿Revocar este consentimiento?")) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeConsentAction(consentId, patientId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="ghost" size="sm" onClick={onRevoke} disabled={pending}>
        {pending ? "Revocando..." : "Revocar"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
