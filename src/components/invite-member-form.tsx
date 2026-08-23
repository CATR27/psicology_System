"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  invitationSchema,
  type InvitationInput,
} from "@/lib/schemas/invitation";
import { inviteMemberAction } from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteMemberForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { email: "", rol: "org:member" },
  });

  function onSubmit(values: InvitationInput) {
    setError(null);
    setSent(false);
    startTransition(async () => {
      const result = await inviteMemberAction(values);
      if (result.ok) {
        setSent(true);
        reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo del psicólogo</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rol">Rol</Label>
        <select
          id="rol"
          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          {...register("rol")}
        >
          <option value="org:member">Psicólogo</option>
          <option value="org:recepcion">Recepción</option>
          <option value="org:admin">Admin</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {sent && (
        <p className="text-sm text-muted-foreground">
          Invitación enviada por correo.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Invitar"}
      </Button>
    </form>
  );
}
