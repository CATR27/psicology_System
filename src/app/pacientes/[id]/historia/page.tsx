import Link from "next/link";

import { getPatient } from "@/lib/dal/patients";
import { getHistoria } from "@/lib/dal/historias";
import {
  emptyHistoriaClinica,
  type HistoriaClinica,
} from "@/lib/schemas/historia-clinica";
import { Button } from "@/components/ui/button";
import { HistoriaWizard } from "@/components/historia-clinica/historia-wizard";

export default async function HistoriaClinicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  const historia = await getHistoria(id);
  const initial = historia
    ? (historia.datos as unknown as HistoriaClinica)
    : emptyHistoriaClinica;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="space-y-1">
        <Link
          href={`/pacientes/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {patient.nombre}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Historia clínica
          </h1>
          {historia && (
            <a href={`/api/pacientes/${id}/historia/pdf`} target="_blank">
              <Button variant="outline" size="sm">
                Descargar PDF
              </Button>
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Todo es opcional y se guarda automáticamente mientras escribes.
        </p>
      </div>

      <HistoriaWizard patientId={id} initial={initial} />
    </div>
  );
}
