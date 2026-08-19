import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PdfSection = { heading: string; rows: [string, string][] };

const MARGIN = 56;
const PAGE_W = 595;
const PAGE_H = 842;

function humanize(key: string): string {
  const s = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isFilled(v: unknown): boolean {
  return !(
    v === null ||
    v === undefined ||
    v === "" ||
    v === false ||
    (Array.isArray(v) && v.length === 0)
  );
}

function flatten(value: unknown, prefix = ""): [string, string][] {
  const rows: [string, string][] = [];
  if (!value || typeof value !== "object") return rows;
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (!isFilled(v)) continue;
    const label = prefix ? `${prefix} — ${humanize(key)}` : humanize(key);
    if (Array.isArray(v)) {
      if (typeof v[0] === "object") {
        (v as Record<string, unknown>[]).forEach((item, i) => {
          rows.push(...flatten(item, `${label} ${i + 1}`));
        });
      } else {
        rows.push([label, (v as string[]).join(", ")]);
      }
    } else if (typeof v === "object") {
      rows.push(...flatten(v, label));
    } else {
      rows.push([label, String(v)]);
    }
  }
  return rows;
}

const HISTORIA_SECCIONES: [string, string][] = [
  ["Identificación", "identificacion"],
  ["Historia familiar", "historiaFamiliar"],
  ["Relaciones interpersonales", "relacionesInterpersonales"],
  ["Factores emocionales", "factoresEmocionales"],
  ["Factores biológicos", "factoresBiologicos"],
  ["Adicciones", "adicciones"],
  ["Antecedentes escolares", "antecedentesEscolares"],
  ["Antecedentes laborales", "antecedentesLaborales"],
  ["Situación actual", "situacionActual"],
  ["Agregado del paciente", "agregadoPaciente"],
  ["Observaciones generales", "observacionesGenerales"],
];

export function flattenHistoria(data: Record<string, unknown>): PdfSection[] {
  const sections: PdfSection[] = [];
  for (const [heading, key] of HISTORIA_SECCIONES) {
    const value = data[key];
    const rows =
      typeof value === "string"
        ? value.trim()
          ? [[heading, value] as [string, string]]
          : []
        : flatten(value);
    if (rows.length > 0) sections.push({ heading, rows });
  }
  if (data.avisoPrivacidadAceptado === true) {
    sections.push({
      heading: "Aviso de privacidad",
      rows: [["Estado", "Aceptado"]],
    });
  }
  return sections;
}

export function flattenSesion(data: {
  numeroSesion: number;
  fecha: string;
  paciente: string;
  contenido: {
    objetivoSesion?: string;
    temasCentrales?: string;
    senalamientos?: string;
    climaAfectivo?: string;
    observaciones?: string;
  };
}): PdfSection[] {
  const c = data.contenido;
  const rows: [string, string][] = [
    ["Paciente", data.paciente],
    ["Sesión", String(data.numeroSesion)],
    ["Fecha", data.fecha],
  ];
  if (c.objetivoSesion) rows.push(["Objetivo de la sesión", c.objetivoSesion]);
  if (c.temasCentrales) rows.push(["Temas centrales", c.temasCentrales]);
  if (c.senalamientos)
    rows.push(["Señalamientos e interpretaciones", c.senalamientos]);
  if (c.climaAfectivo) rows.push(["Clima afectivo", c.climaAfectivo]);
  if (c.observaciones) rows.push(["Observaciones", c.observaciones]);
  return [{ heading: "Formato de sesión", rows }];
}

export async function buildPdf(
  title: string,
  sections: PdfSection[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const draw = (
    text: string,
    size: number,
    f: typeof font,
    color = rgb(0, 0, 0),
    lineHeight: number,
  ) => {
    const maxWidth = PAGE_W - MARGIN * 2;
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth && line) {
        page.drawText(line, { x: MARGIN, y, size, font: f, color });
        y -= lineHeight;
        if (y < MARGIN) {
          page = doc.addPage([PAGE_W, PAGE_H]);
          y = PAGE_H - MARGIN;
        }
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: MARGIN, y, size, font: f, color });
      y -= lineHeight;
      if (y < MARGIN) {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
    }
  };

  draw(title, 18, bold, rgb(0, 0, 0), 24);
  y -= 12;

  for (const section of sections) {
    if (y < MARGIN + 40) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    draw(section.heading, 13, bold, rgb(0.2, 0.2, 0.2), 18);
    y -= 4;
    for (const [label, value] of section.rows) {
      draw(label, 9, bold, rgb(0.4, 0.4, 0.4), 13);
      draw(value, 10, font, rgb(0, 0, 0), 14);
      y -= 3;
    }
    y -= 8;
  }

  return doc.save();
}
