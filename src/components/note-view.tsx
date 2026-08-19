import type { SoapNote } from "@/lib/schemas/note";
import { Badge } from "@/components/ui/badge";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">{body}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <ul className="list-disc list-inside text-sm space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function NoteView({ soap }: { soap: SoapNote }) {
  return (
    <div className="space-y-4">
      <Section title="S — Subjetivo" body={soap.subjetivo} />
      <Section title="O — Objetivo" body={soap.objetivo} />
      <Section title="A — Análisis" body={soap.analisis} />
      <Section title="P — Plan" body={soap.plan} />

      {soap.temas && soap.temas.length > 0 && (
        <List title="Temas principales" items={soap.temas} />
      )}
      {soap.tareas && soap.tareas.length > 0 && (
        <List title="Tareas para el paciente" items={soap.tareas} />
      )}

      {soap.riesgos && soap.riesgos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Señales de riesgo
          </h4>
          <ul className="space-y-2">
            {soap.riesgos.map((r, i) => (
              <li
                key={i}
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{r.severidad}</Badge>
                  <span className="text-sm font-medium">{r.tipo}</span>
                </div>
                <p className="text-sm mt-1">{r.descripcion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
