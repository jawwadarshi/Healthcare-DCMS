import { z } from "zod";

export const completeTreatmentSchema = z.object({
    body: z.object({
        appointmentId: z.string().uuid(),
        diagnosis: z.string().min(1).optional(),
        prescription: z.string().min(1).optional(),
        notes: z.string().min(1).optional(),
        serviceIds: z.array(z.string().uuid()).min(1),
    }),
    params: z.object({}),
    query: z.object({}),
});

export const getTreatmentHistorySchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({}).optional(),
    query: z.object({}),
});

export const getTreatmentHistoryByPatientSchema = z.object({
    params: z.object({
        patientId: z.string().uuid(),
    }),
    body: z.object({}).optional(),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        sortBy: z.enum(["treatmentDate", "createdAt"]).default("treatmentDate"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
});

export const getTreatmentHistoryByAppointmentSchema = z.object({
    params: z.object({
        appointmentId: z.string().uuid(),
    }),
    body: z.object({}).optional(),
    query: z.object({}),
});

export const listTreatmentPatientsSchema = z.object({
    params: z.object({}).optional(),
    body: z.object({}).optional(),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
    }),
});

export type CompleteTreatmentInput = z.infer<typeof completeTreatmentSchema>["body"];
export type GetTreatmentHistoryByPatientQuery = z.infer<typeof getTreatmentHistoryByPatientSchema>["query"];
export type ListTreatmentPatientsQuery = z.infer<typeof listTreatmentPatientsSchema>["query"];