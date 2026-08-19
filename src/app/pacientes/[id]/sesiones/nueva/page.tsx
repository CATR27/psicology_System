import { getPatient } from "@/lib/dal/patients";
import { SessionForm } from "@/components/session-form";

export default async function NuevaSesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nueva sesión · {patient.nombre}
      </h1>
      <SessionForm patientId={id} />
    </div>
  );
}
