import { z } from "zod";

export const parseScribeSchema = z.object({
    body: z.object({
        rawText: z.string().min(3, "Scribe input text cannot be empty"),
    }),
    patientIdOverride: z.string().uuid().optional(),
    params: z.object({}),
    query: z.object({}),
});

export type ParseScribeInput = z.infer<typeof parseScribeSchema>["body"];