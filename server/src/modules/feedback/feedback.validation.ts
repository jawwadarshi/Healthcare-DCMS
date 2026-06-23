import { z } from "zod";

export const createFeedbackSchema = z.object({
    body: z.object({
        customerName: z.string().min(1, "Name is required").max(255),
        visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
        rating: z.number().int().min(1).max(5),
        comments: z.string().max(2000).optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>["body"];