import { getPatient } from "@/lib/dal/patients";
import { getHistoria } from "@/lib/dal/historias";
import { buildPdf, flattenHistoria } from "@/lib/pdf";

export const runtime = "nodejs";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const patient = await getPatient(id);
  const historia = await getHistoria(id);

  if (!historia) {
    return new Response("No hay historia clínica registrada", { status: 404 });
  }

  const sections = flattenHistoria(historia.datos as Record<string, unknown>);
  const pdf = await buildPdf(
    `Historia clínica — ${patient.nombre}`,
    sections,
  );

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="historia-${safeName(patient.nombre)}.pdf"`,
    },
  });
}
