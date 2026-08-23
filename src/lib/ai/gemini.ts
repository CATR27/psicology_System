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

export async function generateFormatoSesion(
  transcript: string,
  memoryNotes: string[] = [],
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const interaction = await ai.interactions.create({
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
    input: buildPrompt(transcript, memoryNotes),
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
