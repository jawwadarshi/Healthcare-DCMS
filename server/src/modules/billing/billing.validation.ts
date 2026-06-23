import { z } from "zod";

export const createInvoiceSchema = z.object({
    body: z.object({
        patientId: z.string().uuid(),
        treatmentHistoryId: z.string().uuid().optional(),
        items: z
            .array(
                z.object({
                    serviceId: z.string().uuid(),
                    description: z.string().min(1),
                    quantity: z.number().int().min(1).default(1),
                    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
                })
            )
            .min(1),
        discount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
        dueDate: z.string().datetime().optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});

export const updatePaymentStatusSchema = z.object({
    body: z.object({
        paymentStatus: z.enum(["pending", "paid", "partially_paid"]),
        paymentMethod: z.string().min(1).optional(),
        paymentDate: z.string().datetime().optional(),
        paymentNotes: z.string().min(1).optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({}),
});

export const getInvoiceSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({}).optional().default({}),
    query: z.object({}),
});

export const getPatientInvoicesSchema = z.object({
    params: z.object({
        patientId: z.string().uuid(),
    }),
    body: z.object({}).optional(),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        paymentStatus: z.enum(["pending", "paid", "partially_paid"]).optional(),
        sortBy: z.enum(["issuedDate", "total"]).default("issuedDate"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
});

export const listAllInvoicesSchema = z.object({
    params: z.object({}).optional(),
    body: z.object({}).optional(),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        paymentStatus: z.enum(["pending", "paid", "partially_paid"]).optional(),
        search: z.string().optional(),
    }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>["body"];
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>["body"];
export type GetPatientInvoicesQuery = z.infer<typeof getPatientInvoicesSchema>["query"];
export type ListAllInvoicesQuery = z.infer<typeof listAllInvoicesSchema>["query"];