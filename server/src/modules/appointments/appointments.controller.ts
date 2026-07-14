

import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { appointmentsService } from "./appointments.service.js";
import type { AppointmentRow } from "./appointments.repository.js";

const toIsoDateTime = (value: Date): string => value.toISOString();

const toAppointmentContract = (row: AppointmentRow) => {
  return {
    id: row.id,
    patientId: row.patientId,
    doctorId: row.doctorId,
    serviceId: row.serviceId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    patientEmail: row.patientEmail,
    appointmentDate: row.appointmentDate.toString(),
    appointmentTime: row.appointmentTime.toString(),
    status: row.status,
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  };
};

export class AppointmentsController {

  publicBooking = asyncHandler(async (req, res) => {
    // Passes null for creatorId because this is a public lead
    const created = await appointmentsService.createPublicBooking(null, req.body); //appointmentsService.createPublicBooking(null, req.body): Calls the business logic layer. It explicitly passes null for the user/creator ID (because the user is anonymous) and passes req.body (the data submitted by the client, like name, date, time) to save the booking.

    return sendSuccessResponse(
      res,
      "Appointment booked successfully",
      toAppointmentContract(created),
      201
    );
  });

  create = asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const created = await appointmentsService.createAppointment(req.user.userId, req.body);
    //const created =: This creates a temporary container (variable) to hold the finalized appointment details once the database finishes creating it.
    //.createAppointment(...): The specific service function called to do the work.
    //req.user.userId: It passes the logged-in user's unique ID badge so the database knows exactly who is creating this appointment.
    //req.body: It passes the actual form data the user submitted (like the date, time, and patient details).

    return sendSuccessResponse(   //sendSuccessResponse(...): This is a clean utility function built to format your server's responses so they always look neat and consistent
      res,  //res: This passes the Express response tool directly into the helper function so it actually has the power to talk back to the client's browser.
      "Appointment created successfully",
      toAppointmentContract(created), //This is a data-cleaning mapper function (a "contract").
      201
    );
  });

  list = asyncHandler(async (req, res) => {
    const query = { ...(req.query as any) };

    // ─── Doctor-Specific Filtering ────────────────────────────────────
    // If the authenticated user is a DOCTOR, force filter to their own appointments
    if (req.user && req.user.role === 'doctor' && req.user.doctorId) {
      query.doctorId = req.user.doctorId;
    }

    const { items, total } = await appointmentsService.listAppointments(query);
    return sendSuccessResponse(res, "Appointments fetched successfully", {
      items: items.map(toAppointmentContract),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    });
  });

  getById = asyncHandler(async (req, res) => {
    const appointment = await appointmentsService.getAppointmentById(req.params.id as string);
    return sendSuccessResponse(
      res,
      "Appointment fetched successfully",
      toAppointmentContract(appointment)
    );
  });

  update = asyncHandler(async (req, res) => {
    const updated = await appointmentsService.updateAppointment(
      req.params.id as string,
      req.body
    );
    return sendSuccessResponse(
      res,
      "Appointment updated successfully",
      toAppointmentContract(updated)
    );
  });

  delete = asyncHandler(async (req, res) => {
    const deleted = await appointmentsService.deleteAppointment(req.params.id as string);
    return sendSuccessResponse(res, "Appointment deleted successfully", { id: deleted.id });
  });
}

export const appointmentsController = new AppointmentsController();