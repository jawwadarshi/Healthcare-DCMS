import { z } from "zod";

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().min(1),
    durationInMinutes: z.number().int().positive(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "basePrice must be a valid decimal"),
    isActive: z.boolean().optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const updateServiceSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().min(1).optional(),
      durationInMinutes: z.number().int().positive().optional(),
      basePrice: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "basePrice must be a valid decimal")
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).optional().default({}),
});

export const getServiceByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const deleteServiceSchema = getServiceByIdSchema;

export const listServicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["name", "createdAt", "basePrice"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>["body"];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>["body"];
export type ListServicesQuery = z.infer<typeof listServicesSchema>["query"];
export type GetServiceByIdParams = z.infer<typeof getServiceByIdSchema>["params"];
