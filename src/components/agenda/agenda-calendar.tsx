"use client";

import { useMemo, useState, useTransition } from "react";

import {
  cancelAppointmentAction,
  createAppointmentAction,
  rescheduleAppointmentAction,
} from "@/app/actions/appointments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Patient = { id: string; nombre: string; email: string | null };
type Appointment = {
  id: string;
  inicio: string;
  fin: string;
  estado: string;
  patient: { id: string; nombre: string; email: string | null };
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgendaCalendar({
  patients,
  appointments,
}: {
  patients: Patient[];
  appointments: Appointment[];
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = new Date(a.inicio).toDateString();
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  function navegar(dir: number) {
    setCursor((c) => {
      const x = new Date(c);
      if (view === "month") x.setMonth(x.getMonth() + dir);
      else x.setDate(x.getDate() + dir * 7);
      return x;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navegar(-1)}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => navegar(1)}>
            →
          </Button>
          <span className="ml-1 font-medium">
            {view === "month"
              ? `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
              : `${weekDays[0].getDate()} — ${weekDays[6].getDate()} de ${
                  MESES[cursor.getMonth()]
                } ${cursor.getFullYear()}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1 text-sm",
                view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1 text-sm",
                view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Semana
            </button>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            Nueva cita
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
          {DIAS.map((d) => (
            <div key={d} className="bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {monthDays.map((day) => {
            const key = day.toDateString();
            const items = byDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === cursor.getMonth();
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[88px] bg-background p-1.5 text-sm",
                  !isCurrentMonth && "text-muted-foreground/50 bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-6 text-center leading-6 rounded-full",
                    sameDay(day, new Date()) && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      className="block w-full truncate rounded bg-secondary px-1.5 py-0.5 text-left text-[11px] hover:bg-secondary/70"
                      title={`${hora(a.inicio)} · ${a.patient.nombre}`}
                    >
                      {hora(a.inicio)} {a.patient.nombre}
                    </button>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{items.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
          {weekDays.map((day) => {
            const items = byDay.get(day.toDateString()) ?? [];
            return (
              <div key={day.toISOString()} className="bg-background p-2 min-h-[160px]">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {DIAS[(day.getDay() + 6) % 7]} {day.getDate()}
                </div>
                <div className="space-y-1.5">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      className="w-full rounded border p-1.5 text-left text-xs space-y-1 hover:bg-muted"
                    >
                      <p className="font-medium">{hora(a.inicio)}</p>
                      <p>{a.patient.nombre}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">Nueva cita</h2>
            <AppointmentForm patients={patients} onClose={() => setShowNew(false)} />
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <AppointmentDetail
              appointment={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentDetail({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [reprogramar, setReprogramar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inicioDate = new Date(appointment.inicio);
  const finDate = new Date(appointment.fin);
  const duracionMin = Math.round(
    (finDate.getTime() - inicioDate.getTime()) / 60000,
  );

  function onCancelar() {
    if (!confirm("¿Cancelar esta cita?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointment.id);
      if (result.ok) {
        onClose();
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  }

  function onSubmitReprogramar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const fecha = String(form.get("fecha") ?? "");
    const hora = String(form.get("hora") ?? "");
    if (!fecha || !hora) {
      setError("Selecciona fecha y hora.");
      return;
    }
    const inicioLocal = new Date(`${fecha}T${hora}`);
    const finLocal = new Date(inicioLocal.getTime() + duracionMin * 60000);

    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        appointmentId: appointment.id,
        inicio: inicioLocal.toISOString(),
        fin: finLocal.toISOString(),
      });
      if (result.ok) {
        onClose();
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  }

  if (reprogramar) {
    return (
      <form onSubmit={onSubmitReprogramar} className="space-y-3">
        <h2 className="text-lg font-semibold">Reprogramar cita</h2>
        <p className="text-sm text-muted-foreground">{appointment.patient.nombre}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="r-fecha">Fecha</Label>
            <Input
              id="r-fecha"
              name="fecha"
              type="date"
              defaultValue={inicioDate.toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-hora">Hora</Label>
            <Input
              id="r-hora"
              name="hora"
              type="time"
              defaultValue={inicioDate.toTimeString().slice(0, 5)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setReprogramar(false)}>
            Atrás
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar nueva fecha"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{appointment.patient.nombre}</h2>
      <p className="text-sm text-muted-foreground">
        {inicioDate.toLocaleString("es-MX", {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setReprogramar(true)}
          disabled={pending}
        >
          Reprogramar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onCancelar}
          disabled={pending}
        >
          {pending ? "Cancelando…" : "Cancelar cita"}
        </Button>
      </div>
    </div>
  );
}

function AppointmentForm({
  patients,
  onClose,
}: {
  patients: Patient[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const patientId = String(form.get("patientId") ?? "");
    const fecha = String(form.get("fecha") ?? "");
    const hora = String(form.get("hora") ?? "");
    const duracion = Number(form.get("duracion") ?? 50);

    if (!patientId || !fecha || !hora) {
      setError("Selecciona paciente, fecha y hora.");
      return;
    }

    const inicioLocal = new Date(`${fecha}T${hora}`);
    const finLocal = new Date(inicioLocal.getTime() + duracion * 60000);

    startTransition(async () => {
      const result = await createAppointmentAction({
        patientId,
        inicio: inicioLocal.toISOString(),
        fin: finLocal.toISOString(),
      });
      if (result.ok) {
        onClose();
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="patientId">Paciente</Label>
        <select
          id="patientId"
          name="patientId"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Seleccionar…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hora">Hora</Label>
          <Input id="hora" name="hora" type="time" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="duracion">Duración (minutos)</Label>
        <Input id="duracion" name="duracion" type="number" defaultValue={50} min={5} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cita"}
        </Button>
      </div>
    </form>
  );
}
