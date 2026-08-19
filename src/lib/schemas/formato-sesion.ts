import { z } from "zod";

export const formatoSesionSchema = z.object({
  objetivoSesion: z.string().trim().min(1, "El objetivo de la sesión es obligatorio"),
  temasCentrales: z.string().trim().min(1, "Los temas centrales son obligatorios"),
  senalamientos: z.string().trim().min(1, "Los señalamientos son obligatorios"),
  climaAfectivo: z.string().trim().min(1, "Indica el clima afectivo"),
  observaciones: z.string().trim().optional().default(""),
});

export type FormatoSesion = z.infer<typeof formatoSesionSchema>;
