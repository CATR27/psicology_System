import { listPatients } from "@/lib/dal/patients";
import { listAppointments } from "@/lib/dal/appointments";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";

export default async function AgendaPage() {
  const patients = await listPatients();
  const appointments = await listAppointments();

  const patientsSerialized = patients.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
  }));
  const appointmentsSerialized = appointments.map((a) => ({
    id: a.id,
    inicio: a.inicio.toISOString(),
    fin: a.fin.toISOString(),
    estado: a.estado,
    patient: { id: a.patient.id, nombre: a.patient.nombre, email: a.patient.email },
  }));

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
      <AgendaCalendar
        patients={patientsSerialized}
        appointments={appointmentsSerialized}
      />
    </div>
  );
}
