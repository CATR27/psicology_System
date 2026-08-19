import Link from "next/link";

import { getPatient } from "@/lib/dal/patients";
import { listSessions } from "@/lib/dal/sessions";
import { getHistoria } from "@/lib/dal/historias";
import {
  computeHistoriaProgress,
  type HistoriaClinica,
} from "@/lib/schemas/historia-clinica";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentForm } from "@/components/consent-form";
import { RevokeConsentButton } from "@/components/revoke-consent-button";
import { DeleteSessionButton } from "@/components/delete-session-button";

export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  const sessions = await listSessions(id);
  const historia = await getHistoria(id);
  const historiaData = historia
    ? (historia.datos as unknown as HistoriaClinica)
    : null;
  const progress = historiaData ? computeHistoriaProgress(historiaData) : 0;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {patient.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {patient.fechaNacimiento
              ? new Date(patient.fechaNacimiento).toLocaleDateString("es-MX")
              : "Sin fecha de nacimiento"}
            {patient.contacto ? ` · ${patient.contacto}` : ""}
          </p>
        </div>
        <Link href={`/pacientes/${id}/editar`}>
          <Button variant="outline" size="sm">
            Editar datos
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historia clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Documento integral del paciente. Llénalo a tu ritmo: todo es
              opcional y se guarda automáticamente.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Link href={`/pacientes/${id}/historia`}>
              <Button size="sm" className="w-full">
                {progress > 0 ? "Continuar" : "Comenzar"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Inicia una sesión y registra el formato de consulta (objetivo,
              temas, clima afectivo, señalamientos).
            </p>
            <Link href={`/pacientes/${id}/sesiones/nueva`}>
              <Button size="sm" variant="secondary" className="w-full">
                Iniciar consulta
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay sesiones para este paciente.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const nota = s.clinicalNotes[0];
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <Link
                      href={`/sesiones/${s.id}`}
                      className="flex flex-1 items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium">Sesión {s.numeroSesion}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.iniciadaEn).toLocaleString("es-MX")}
                        </p>
                      </div>
                      {nota ? (
                        <Badge
                          variant={
                            nota.estado === "FIRMADA" ? "default" : "secondary"
                          }
                        >
                          {nota.estado === "FIRMADA" ? "Firmada" : "Borrador"}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin registro
                        </span>
                      )}
                    </Link>
                    <DeleteSessionButton
                      sessionId={s.id}
                      patientId={id}
                      label="Borrar"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consentimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patient.consents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay consentimientos registrados.
            </p>
          ) : (
            <ul className="space-y-2">
              {patient.consents.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={c.revocadoEn ? "outline" : "secondary"}>
                      {c.tipo === "GRABACION" ? "Grabación" : "Tratamiento IA"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(c.otorgadoEn).toLocaleDateString("es-MX")}
                      {c.revocadoEn ? " · revocado" : " · vigente"}
                    </span>
                  </div>
                  {!c.revocadoEn && (
                    <RevokeConsentButton consentId={c.id} patientId={id} />
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t pt-4">
            <ConsentForm patientId={id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
