import { z } from "zod";

export const patientSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  fechaNacimiento: z.string().trim().max(10).optional(),
  contacto: z.string().trim().max(200).optional(),
  email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
});

export type PatientInput = z.infer<typeof patientSchema>;
