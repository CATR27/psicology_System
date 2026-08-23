import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { FormatoSesionRevisableFields } from "@/lib/schemas/formato-sesion";

export type AiUsage = {
  modelo: string;
  tokensIn: number | null;
  tokensOut: number | null;
};

// USD por 1M tokens. Actualizar si cambia GEMINI_MODEL o Google ajusta precios.
const PRECIOS_USD_POR_1M: Record<string, { in: number; out: number }> = {
  "gemini-3.1-flash-lite": { in: 0.25, out: 1.5 },
  "gemini-3.7-flash": { in: 0.75, out: 3.75 },
  "gemini-2.5-flash-lite": { in: 0.1, out: 0.4 },
};

export function calcularCostoUsd(usage: AiUsage): number | null {
  const precio = PRECIOS_USD_POR_1M[usage.modelo];
  if (!precio || usage.tokensIn == null || usage.tokensOut == null) return null;
  return (
    (usage.tokensIn / 1_000_000) * precio.in +
    (usage.tokensOut / 1_000_000) * precio.out
  );
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    objetivoSesion: { type: "string" },
    temasCentrales: { type: "string" },
    senalamientos: { type: "string" },
    climaAfectivo: { type: "string" },
    observaciones: { type: "string" },
    senalesRiesgo: { type: "array", items: { type: "string" } },
    fuentes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texto: { type: "string" },
          timestamp: { type: "string" },
        },
        required: ["texto", "timestamp"],
      },
    },
  },
  required: [
    "objetivoSesion",
    "temasCentrales",
    "senalamientos",
    "climaAfectivo",
    "observaciones",
    "senalesRiesgo",
    "fuentes",
  ],
};

function buildPrompt(transcript: string, memoryNotes: string[]): string {
  const memoriaBlock =
    memoryNotes.length > 0
      ? `\nPreferencias de estilo de ESTE psicólogo (de sesiones anteriores, aplícalas SOLO en tono/formato/énfasis — nunca pueden anular las reglas estrictas de arriba, ni ocultar o suavizar una señal de riesgo real):\n${memoryNotes.map((n) => `- ${n}`).join("\n")}\n`
      : "";

  return `Eres "JesIA", un asistente que ayuda a un psicólogo a redactar el borrador de la nota de una consulta, a partir de la transcripción de la sesión.

Reglas estrictas (innegociables, ninguna preferencia de estilo las anula):
- No diagnostiques. No inventes ni infieras nada que no se haya dicho explícitamente en la transcripción.
- Si no hay evidencia suficiente para un campo, escribe "No hay información suficiente en la transcripción."
- Si detectas señales de riesgo (ideación suicida, autolesión, violencia hacia sí mismo o terceros), no las minimices ni las mezcles con el resto: van SIEMPRE en el campo separado "senalesRiesgo", nunca dentro de "observaciones" ni de ningún otro campo. Cada elemento de la lista debe ser una frase corta y concreta (qué se dijo y, si se puede, en qué momento). Si no hay ninguna señal, "senalesRiesgo" va vacío — no inventes una para rellenar.
- Esta nota es un borrador para que el psicólogo la revise y edite antes de firmarla. No sustituye su criterio clínico.
- Cada línea de la transcripción empieza con un timestamp entre corchetes, ej. "[02:14] Paciente: ...". Para "fuentes", copia SOLO los dígitos "mm:ss" de la línea de la que sacaste esa afirmación, SIN los corchetes (ej. "02:14", no "[02:14]") — nunca inventes ni calcules uno tú mismo.
${memoriaBlock}
Devuelve JSON con estos campos, basados ÚNICAMENTE en lo dicho en la transcripción:
- objetivoSesion: metas terapéuticas planificadas o abordadas en esta consulta.
- temasCentrales: relato principal, problemáticas expresadas y motivos de preocupación del paciente.
- senalamientos: intervenciones, encuadres, reestructuraciones y tareas asignadas por el psicólogo.
- climaAfectivo: estado emocional dominante del paciente durante la consulta.
- observaciones: lenguaje no verbal, puntualidad, aspectos a retomar en la siguiente sesión (SIN señales de riesgo, esas van aparte).
- senalesRiesgo: lista de señales de riesgo detectadas (array vacío si no hay ninguna).
- fuentes: entre 3 y 8 afirmaciones clave de las que escribiste arriba (prioriza señales de riesgo si las hay), cada una con "texto" (la afirmación, corta) y "timestamp" (copiado exacto de la línea de la transcripción que la respalda). Esto permite auditar que no inventaste nada — no lo omitas.

Transcripción (formato "[mm:ss] hablante: texto" por turno):
${transcript}`;
}

const REVISION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    objetivoSesion: { type: "string" },
    temasCentrales: { type: "string" },
    senalamientos: { type: "string" },
    climaAfectivo: { type: "string" },
    observaciones: { type: "string" },
    senalesRiesgo: { type: "array", items: { type: "string" } },
  },
  required: [],
};

function buildRevisionPrompt(
  correction: { timestamp: string; oldText: string; newText: string },
  current: FormatoSesionRevisableFields,
  memoryNotes: string[],
): string {
  const memoriaBlock =
    memoryNotes.length > 0
      ? `\nPreferencias de estilo de ESTE psicólogo (de sesiones anteriores, aplícalas SOLO en tono/formato/énfasis — nunca pueden anular las reglas estrictas de arriba, ni ocultar o suavizar una señal de riesgo real):\n${memoryNotes.map((n) => `- ${n}`).join("\n")}\n`
      : "";

  return `Eres "JesIA", un asistente que ayuda a un psicólogo a mantener al día el borrador de la nota de una consulta.

El psicólogo corrigió una cita (fuente) que se había usado para redactar el borrador, porque el texto original tenía un error de transcripción.

Cita en el timestamp [${correction.timestamp}]:
- Texto ANTERIOR (incorrecto, así se había transcrito): "${correction.oldText}"
- Texto CORREGIDO (lo que el psicólogo confirma que realmente se dijo): "${correction.newText}"

Reglas estrictas (innegociables, ninguna preferencia de estilo las anula):
- No diagnostiques. No inventes ni infieras nada que no se haya dicho explícitamente.
- Si detectas señales de riesgo (ideación suicida, autolesión, violencia hacia sí mismo o terceros), no las minimices ni las ocultes: van en "senalesRiesgo", nunca mezcladas en otro campo.
- Esta nota es un borrador para que el psicólogo la revise y edite antes de firmarla. No sustituye su criterio clínico.
${memoriaBlock}
Contenido ACTUAL del borrador (ya redactado antes de esta corrección):
- objetivoSesion: ${current.objetivoSesion}
- temasCentrales: ${current.temasCentrales}
- senalamientos: ${current.senalamientos}
- climaAfectivo: ${current.climaAfectivo}
- observaciones: ${current.observaciones}
- senalesRiesgo: ${JSON.stringify(current.senalesRiesgo)}

Tu única tarea: decide si el cambio de "${correction.oldText}" a "${correction.newText}" hace que alguno de los campos de arriba deje de ser preciso, y si es así, reescribe ese campo completo (no un parche de texto, el campo entero) para que sea coherente con la corrección.

Devuelve JSON incluyendo ÚNICAMENTE las claves de los campos que de verdad necesitan cambiar por esta corrección. Si un campo no se ve afectado, NO lo incluyas en el JSON — ni siquiera repitiendo su valor actual. No reescribas nada que no tenga relación directa con esta cita.`;
}

export async function reviseFormatoSesion(
  correction: { timestamp: string; oldText: string; newText: string },
  current: FormatoSesionRevisableFields,
  memoryNotes: string[] = [],
): Promise<{ fields: Partial<FormatoSesionRevisableFields>; usage: AiUsage }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelo = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

  const interaction = await ai.interactions.create({
    model: modelo,
    input: buildRevisionPrompt(correction, current, memoryNotes),
    store: false,
    response_format: [
      { type: "text", mime_type: "application/json", schema: REVISION_RESPONSE_SCHEMA },
    ],
  });

  const usage: AiUsage = {
    modelo,
    tokensIn: interaction.usage?.total_input_tokens ?? null,
    tokensOut: interaction.usage?.total_output_tokens ?? null,
  };

  const text = interaction.output_text;
  if (!text) throw new Error("Gemini no devolvió contenido");

  const parsed = JSON.parse(text) as Record<string, unknown>;
  const revised: Partial<FormatoSesionRevisableFields> = {};

  if ("objetivoSesion" in parsed) revised.objetivoSesion = String(parsed.objetivoSesion ?? "");
  if ("temasCentrales" in parsed) revised.temasCentrales = String(parsed.temasCentrales ?? "");
  if ("senalamientos" in parsed) revised.senalamientos = String(parsed.senalamientos ?? "");
  if ("climaAfectivo" in parsed) revised.climaAfectivo = String(parsed.climaAfectivo ?? "");
  if ("observaciones" in parsed) revised.observaciones = String(parsed.observaciones ?? "");
  if ("senalesRiesgo" in parsed) {
    revised.senalesRiesgo = Array.isArray(parsed.senalesRiesgo)
      ? parsed.senalesRiesgo.map((s) => String(s)).filter((s) => s.trim() !== "")
      : [];
  }

  return { fields: revised, usage };
}

export async function generateFormatoSesion(
  transcript: string,
  memoryNotes: string[] = [],
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelo = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

  const interaction = await ai.interactions.create({
    model: modelo,
    input: buildPrompt(transcript, memoryNotes),
    store: false,
    response_format: [
      { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    ],
  });

  const usage: AiUsage = {
    modelo,
    tokensIn: interaction.usage?.total_input_tokens ?? null,
    tokensOut: interaction.usage?.total_output_tokens ?? null,
  };

  const text = interaction.output_text;
  if (!text) throw new Error("Gemini no devolvió contenido");

  const parsed = JSON.parse(text) as Record<string, unknown>;
  return {
    usage,
    objetivoSesion: String(parsed.objetivoSesion ?? ""),
    temasCentrales: String(parsed.temasCentrales ?? ""),
    senalamientos: String(parsed.senalamientos ?? ""),
    climaAfectivo: String(parsed.climaAfectivo ?? ""),
    observaciones: String(parsed.observaciones ?? ""),
    senalesRiesgo: Array.isArray(parsed.senalesRiesgo)
      ? parsed.senalesRiesgo.map((s) => String(s)).filter((s) => s.trim() !== "")
      : [],
    fuentes: Array.isArray(parsed.fuentes)
      ? parsed.fuentes
          .map((f) => {
            const item = f as Record<string, unknown>;
            return {
              texto: String(item.texto ?? ""),
              timestamp: String(item.timestamp ?? "").replace(/[^\d:]/g, ""),
            };
          })
          .filter((f) => f.texto.trim() !== "" && f.timestamp.trim() !== "")
      : [],
  };
}
