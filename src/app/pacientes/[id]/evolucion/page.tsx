import Link from "next/link";

import { getPatient } from "@/lib/dal/patients";
import { listPatientEvolution } from "@/lib/dal/notes";
import type { FormatoSesion } from "@/lib/schemas/formato-sesion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EvolucionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  const sessions = await listPatientEvolution(id);

  const riesgoCounts = sessions.map((s) => {
    const nota = s.clinicalNotes[0];
    if (!nota) return 0;
    const data = nota.contenidoJson as unknown as FormatoSesion;
    return data.senalesRiesgo?.length ?? 0;
  });
  const maxRiesgo = Math.max(1, ...riesgoCounts);

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="space-y-1">
        <Link
          href={`/pacientes/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {patient.nombre}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Evolución del paciente
        </h1>
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
            <ul className="space-y-4">
              {sessions.map((s, i) => {
                const nota = s.clinicalNotes[0] ?? null;
                const data = nota
                  ? (nota.contenidoJson as unknown as FormatoSesion)
                  : null;
                const climaChips = data
                  ? data.climaAfectivo
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                  : [];
                const count = riesgoCounts[i];

                return (
                  <li key={s.id} className="border-b pb-4 last:border-0">
                    <div className="space-y-0.5 mb-2">
                      <p className="font-medium">Sesión {s.numeroSesion}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(s.iniciadaEn).toLocaleString("es-MX")}
                      </p>
                    </div>

                    {!data ? (
                      <span className="text-sm text-muted-foreground">
                        Sin registro
                      </span>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {climaChips.length > 0 ? (
                            climaChips.map((chip, ci) => (
                              <Badge key={ci} variant="secondary">
                                {chip}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sin clima registrado
                            </span>
                          )}
                        </div>

                        <p className="text-sm line-clamp-2">
                          {data.temasCentrales}
                        </p>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground shrink-0">
                            Señales de riesgo
                          </span>
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-destructive"
                              style={{ width: `${(count / maxRiesgo) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    )}
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
