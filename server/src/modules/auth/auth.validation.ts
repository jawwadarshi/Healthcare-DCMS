import { z } from "zod";
import { isAppRole } from "../../common/constants/roles.js";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(64, "Password cannot exceed 64 characters"),
    role: z
      .string()
      .refine((val) => !val || isAppRole(val), {
        message: "Role must be one of: admin, doctor, staff, patient",
      })
      .optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];