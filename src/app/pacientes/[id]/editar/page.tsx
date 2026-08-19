import { getPatient } from "@/lib/dal/patients";
import { PatientForm } from "@/components/patient-form";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Editar paciente
      </h1>
      <PatientForm
        patientId={id}
        initial={{
          nombre: patient.nombre,
          fechaNacimiento: patient.fechaNacimiento,
          contacto: patient.contacto,
        }}
      />
    </div>
  );
}
