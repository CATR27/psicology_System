import "server-only";

import { GoogleGenAI } from "@google/genai";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    objetivoSesion: { type: "string" },
    temasCentrales: { type: "string" },
    senalamientos: { type: "string" },
    climaAfectivo: { type: "string" },
    observaciones: { type: "string" },
  },
  required: [
    "objetivoSesion",
    "temasCentrales",
    "senalamientos",
    "climaAfectivo",
    "observaciones",
  ],
};

function buildPrompt(transcript: string): string {
  return `Eres un asistente que ayuda a un psicólogo a redactar el borrador de la nota de una consulta, a partir de la transcripción de la sesión.

Reglas estrictas:
- No diagnostiques. No inventes ni infieras nada que no se haya dicho explícitamente en la transcripción.
- Si no hay evidencia suficiente para un campo, escribe "No hay información suficiente en la transcripción."
- Si detectas señales de riesgo (ideación suicida, autolesión, violencia hacia sí mismo o terceros), no las minimices: enumeralas explícitamente al INICIO del campo "observaciones", precedidas por "⚠️ SEÑALES DE RIESGO DETECTADAS:" seguido de una lista.
- Esta nota es un borrador para que el psicólogo la revise y edite antes de firmarla. No sustituye su criterio clínico.

Devuelve JSON con estos campos, basados ÚNICAMENTE en lo dicho en la transcripción:
- objetivoSesion: metas terapéuticas planificadas o abordadas en esta consulta.
- temasCentrales: relato principal, problemáticas expresadas y motivos de preocupación del paciente.
- senalamientos: intervenciones, encuadres, reestructuraciones y tareas asignadas por el psicólogo.
- climaAfectivo: estado emocional dominante del paciente durante la consulta.
- observaciones: lenguaje no verbal, puntualidad, aspectos a retomar en la siguiente sesión.

Transcripción (formato "hablante: texto" por turno):
${transcript}`;
}

export async function generateFormatoSesion(transcript: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const interaction = await ai.interactions.create({
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
    input: buildPrompt(transcript),
    store: false,
    response_format: [
      { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    ],
  });

  const text = interaction.output_text;
  if (!text) throw new Error("Gemini no devolvió contenido");

  const parsed = JSON.parse(text) as Record<string, unknown>;
  return {
    objetivoSesion: String(parsed.objetivoSesion ?? ""),
    temasCentrales: String(parsed.temasCentrales ?? ""),
    senalamientos: String(parsed.senalamientos ?? ""),
    climaAfectivo: String(parsed.climaAfectivo ?? ""),
    observaciones: String(parsed.observaciones ?? ""),
  };
}
