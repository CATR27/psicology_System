"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createConsentAction } from "@/app/actions/consents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = {
  tipo: "GRABACION" | "TRATAMIENTO_IA";
  otorgadoEn: string;
  evidenciaUrl: string;
};

export function ConsentForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const values: FormValues = {
      tipo: (form.get("tipo") as FormValues["tipo"]) ?? "GRABACION",
      otorgadoEn: String(form.get("otorgadoEn") ?? ""),
      evidenciaUrl: String(form.get("evidenciaUrl") ?? ""),
    };
    startTransition(async () => {
      const result = await createConsentAction({
        patientId,
        tipo: values.tipo,
        otorgadoEn: values.otorgadoEn,
        evidenciaUrl: values.evidenciaUrl || null,
      });
      if (result.ok) {
        router.refresh();
        (e.currentTarget as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="tipo">Tipo de consentimiento</Label>
        <select
          id="tipo"
          name="tipo"
          defaultValue="GRABACION"
          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="GRABACION">Grabación de audio</option>
          <option value="TRATAMIENTO_IA">Tratamiento con IA</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="otorgadoEn">Fecha de otorgamiento</Label>
        <Input
          id="otorgadoEn"
          name="otorgadoEn"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="evidenciaUrl">
          Evidencia (URL o referencia del documento firmado)
        </Label>
        <Input id="evidenciaUrl" name="evidenciaUrl" placeholder="Opcional" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar consentimiento"}
      </Button>
    </form>
  );
}
