import { z } from "zod";

export const consentTipo = ["GRABACION", "TRATAMIENTO_IA"] as const;

export const consentSchema = z.object({
  patientId: z.string().min(1),
  tipo: z.enum(consentTipo),
  otorgadoEn: z.string().min(1),
  evidenciaUrl: z.string().trim().max(500).optional().nullable(),
});

export type ConsentInput = z.infer<typeof consentSchema>;
