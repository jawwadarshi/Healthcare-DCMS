import { z } from "zod";

const statusSchema = z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]);

const dateTimeValidation = {
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "appointmentDate must be YYYY-MM-DD"),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, "appointmentTime must be HH:MM"),
};

export const publicBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().uuid(),
    patientName: z.string().min(1).max(255),
    patientPhone: z.string().min(6).max(30),
    patientEmail: z.string().email(),
    appointmentDate: dateTimeValidation.appointmentDate,
    appointmentTime: dateTimeValidation.appointmentTime,
    notes: z.string().min(1).optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const createAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid(),
    serviceId: z.string().uuid(),
    patientName: z.string().min(1).max(255),
    patientPhone: z.string().min(6).max(30),
    patientEmail: z.string().email(),
    appointmentDate: dateTimeValidation.appointmentDate,
    appointmentTime: dateTimeValidation.appointmentTime,
    notes: z.string().min(1).optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const updateAppointmentSchema = z.object({
  body: z
    .object({
      doctorId: z.string().uuid().optional(),
      status: statusSchema.optional(),
      appointmentDate: dateTimeValidation.appointmentDate.optional(),
      appointmentTime: dateTimeValidation.appointmentTime.optional(),
      notes: z.string().min(1).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).optional().default({}),
});

export const getAppointmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const deleteAppointmentSchema = getAppointmentByIdSchema;

export const listAppointmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
    doctorId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sortBy: z.enum(["appointmentDate", "createdAt", "status"]).default("appointmentDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>["body"];
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>["body"];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>["body"];
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsSchema>["query"];
export type GetAppointmentByIdParams = z.infer<typeof getAppointmentByIdSchema>["params"];
