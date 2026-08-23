import { z } from "zod";

export const invitationSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  rol: z.enum(["org:member", "org:recepcion", "org:admin"]),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
