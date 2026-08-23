import type { FormatoSesion } from "@/lib/schemas/formato-sesion";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">{body}</p>
    </div>
  );
}

export function RiskBanner({ senales }: { senales: string[] }) {
  if (senales.length === 0) return null;
  return (
    <div className="rounded-md border-2 border-destructive bg-destructive/10 px-4 py-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Señales de riesgo detectadas — requiere atención inmediata
      </div>
      <ul className="list-disc pl-5 text-sm text-destructive">
        {senales.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export function FormatoSesionView({ data }: { data: FormatoSesion }) {
  return (
    <div className="space-y-4">
      <RiskBanner senales={data.senalesRiesgo ?? []} />
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
