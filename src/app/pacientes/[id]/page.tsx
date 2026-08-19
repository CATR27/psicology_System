import Link from "next/link";

import { getPatient } from "@/lib/dal/patients";
import { listSessions } from "@/lib/dal/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentForm } from "@/components/consent-form";
import { RevokeConsentButton } from "@/components/revoke-consent-button";

export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  const sessions = await listSessions(id);

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
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
        <div className="flex gap-2">
          <Link href={`/pacientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </Link>
        </div>
      </div>

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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Sesiones</CardTitle>
          <Link href={`/pacientes/${id}/sesiones/nueva`}>
            <Button size="sm">Nueva sesión</Button>
          </Link>
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
                  <li key={s.id}>
                    <Link
                      href={`/sesiones/${s.id}`}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
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
                          Sin nota
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
