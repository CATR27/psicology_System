"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { patientSchema, type PatientInput } from "@/lib/schemas/patient";
import {
  createPatientAction,
  updatePatientAction,
} from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  patientId?: string;
  initial?: {
    nombre: string;
    fechaNacimiento: Date | null;
    contacto: string | null;
  };
};

export function PatientForm({ patientId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nombre: initial?.nombre ?? "",
      fechaNacimiento: initial?.fechaNacimiento
        ? new Date(initial.fechaNacimiento).toISOString().slice(0, 10)
        : "",
      contacto: initial?.contacto ?? "",
    },
  });

  function onSubmit(values: PatientInput) {
    setError(null);
    startTransition(async () => {
      const result = patientId
        ? await updatePatientAction(patientId, values)
        : await createPatientAction(values);
      if (result.ok) {
        router.push(`/pacientes/${result.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input
          id="nombre"
          placeholder="Nombre del paciente"
          {...register("nombre")}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
        <Input id="fechaNacimiento" type="date" {...register("fechaNacimiento")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contacto">Contacto</Label>
        <Input
          id="contacto"
          placeholder="Teléfono o correo"
          {...register("contacto")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
