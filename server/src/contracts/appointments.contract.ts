import type { ApiSuccessResponse } from "./common.contract.js";

export type AppointmentStatusContract = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export type AppointmentContract = {
  id: string;
  patientId: string | null;
  doctorId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatusContract;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentRequestContract = {
  doctorId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
};

export type PublicBookingRequestContract = {
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
};

export type UpdateAppointmentRequestContract = Partial<{
  doctorId: string;
  status: AppointmentStatusContract;
  notes: string;
  appointmentDate: string;
  appointmentTime: string;
}>;

export type ListAppointmentsQueryContract = Partial<{
  page: string;
  limit: string;
  status: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  sortBy: string;
  sortOrder: string;
}>;

export type AppointmentsListDataContract = {
  items: AppointmentContract[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type AppointmentResponseContract = ApiSuccessResponse<AppointmentContract>;
export type AppointmentsListResponseContract = ApiSuccessResponse<AppointmentsListDataContract>;
export type AppointmentDeleteResponseContract = ApiSuccessResponse<{ id: string }>;
