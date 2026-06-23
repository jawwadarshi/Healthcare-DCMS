import { z } from "zod";

const genderSchema = z.enum(["male", "female", "other"]);

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional(),
    gender: genderSchema,
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD"),
    address: z.string().min(1),
    medicalHistory: z.string().min(1),
    allergies: z.string().min(1),
    emergencyContactName: z.string().min(1).max(255),
    emergencyContactPhone: z.string().min(6).max(30),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const updatePatientSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().min(1).max(100).optional(),
      phone: z.string().min(6).max(30).optional(),
      email: z.string().email().optional(),
      gender: genderSchema.optional(),
      dateOfBirth: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD")
        .optional(),
      address: z.string().min(1).optional(),
      medicalHistory: z.string().min(1).optional(),
      allergies: z.string().min(1).optional(),
      emergencyContactName: z.string().min(1).max(255).optional(),
      emergencyContactPhone: z.string().min(6).max(30).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).optional().default({}),
});

export const getPatientByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const deletePatientSchema = getPatientByIdSchema;

export const listPatientsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    sortBy: z.enum(["createdAt", "firstName"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>["body"];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>["body"];
export type ListPatientsQuery = z.infer<typeof listPatientsSchema>["query"];
