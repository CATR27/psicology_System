import { getSession } from "@/lib/dal/sessions";
import { listNoteVersions } from "@/lib/dal/notes";
import { buildPdf, flattenSesion } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  const versions = await listNoteVersions(id);
  const latest = versions[0];

  if (!latest) {
    return new Response("Sin registro de consulta", { status: 404 });
  }

  const sections = flattenSesion({
    numeroSesion: session.numeroSesion,
    fecha: new Date(session.iniciadaEn).toLocaleString("es-MX"),
    paciente: session.patient.nombre,
    contenido: latest.contenidoJson as {
      objetivoSesion?: string;
      temasCentrales?: string;
      senalamientos?: string;
      climaAfectivo?: string;
      observaciones?: string;
    },
  });

  const pdf = await buildPdf(
    `Consulta — ${session.patient.nombre} (Sesión ${session.numeroSesion})`,
    sections,
  );

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sesion-${session.numeroSesion}.pdf"`,
    },
  });
}
