import { z } from "zod";

export const sessionCreateSchema = z.object({
  patientId: z.string().min(1),
  iniciadaEn: z.string().min(1).optional(),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
