import type { FormatoSesion } from "@/lib/schemas/formato-sesion";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">{body}</p>
    </div>
  );
}

export function FormatoSesionView({ data }: { data: FormatoSesion }) {
  return (
    <div className="space-y-4">
      <Section title="Objetivo de la sesión" body={data.objetivoSesion} />
      <Section title="Temas centrales" body={data.temasCentrales} />
      <Section title="Señalamientos e interpretaciones" body={data.senalamientos} />
      <Section title="Clima afectivo" body={data.climaAfectivo} />
      {data.observaciones ? (
        <Section title="Observaciones" body={data.observaciones} />
      ) : null}
    </div>
  );
}
