import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[\p{L}\p{N}._-]+$/u, "Lettres, chiffres, . _ - (sans espace)"),
  password: z.string().min(8).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
