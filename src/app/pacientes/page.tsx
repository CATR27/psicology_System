import Link from "next/link";

import { listPatients } from "@/lib/dal/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PacientesPage() {
  const patients = await listPatients();

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
        <Link href="/pacientes/nuevo">
          <Button>Nuevo paciente</Button>
        </Link>
      </div>

      {patients.length === 0 ? (
        <p className="text-muted-foreground">
          Aún no hay pacientes. Crea el primero.
        </p>
      ) : (
        <ul className="space-y-2">
          {patients.map((p) => (
            <li key={p.id}>
              <Link href={`/pacientes/${p.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.fechaNacimiento
                          ? new Date(p.fechaNacimiento).toLocaleDateString("es-MX")
                          : "Sin fecha de nacimiento"}
                        {p.psicologo?.nombre ? ` · ${p.psicologo.nombre}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">{p.estado}</Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
