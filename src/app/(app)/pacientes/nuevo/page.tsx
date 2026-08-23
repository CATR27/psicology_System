import { PatientForm } from "@/components/patient-form";

export default function NuevoPacientePage() {
  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo paciente</h1>
      <PatientForm />
    </div>
  );
}
