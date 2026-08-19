import { z } from "zod";

export const RIESGO_SEVERIDAD = ["bajo", "medio", "alto", "critico"] as const;

export const riesgoSchema = z.object({
  tipo: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
  severidad: z.enum(RIESGO_SEVERIDAD).default("medio"),
});

export const soapNoteSchema = z.object({
  subjetivo: z.string().trim().min(1, "El campo subjetivo es obligatorio"),
  objetivo: z.string().trim().min(1, "El campo objetivo es obligatorio"),
  analisis: z.string().trim().min(1, "El análisis es obligatorio"),
  plan: z.string().trim().min(1, "El plan es obligatorio"),
  temas: z.array(z.string().trim().min(1)).default([]),
  tareas: z.array(z.string().trim().min(1)).default([]),
  riesgos: z.array(riesgoSchema).default([]),
});

export type Riesgo = z.infer<typeof riesgoSchema>;
export type SoapNote = z.infer<typeof soapNoteSchema>;
