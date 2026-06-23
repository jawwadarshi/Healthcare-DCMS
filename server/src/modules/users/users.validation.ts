import { z } from "zod";
import { AppRole } from "../../common/constants/roles.js";

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    role: z.nativeEnum(AppRole).optional(),
    sortBy: z.enum(["name", "email", "role", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>["query"];
