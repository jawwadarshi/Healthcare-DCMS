

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
    //const { items, total } =: This uses Object Destructuring. Your service is going to return a single bundle containing two things: an array of appointments (items) and a count of how many matching rows exist in total (total). This syntax unpacks them into individual variables immediately.
    const { items, total } = await appointmentsService.listAppointments(req.query as any); //req.query as any: req.query grabs whatever search filters are typed into the website URL bar (like ?page=2&limit=10&status=confirmed). The as any tells TypeScript: "Don't be too strict about checking the exact types of these filters right now."
    return sendSuccessResponse(res, "Appointments fetched successfully", {
      items: items.map(toAppointmentContract), //items: This is the data key holding your list of appointments inside the final response object. items.map(...): This is a JavaScript loop. It goes through every single appointment row returned from your database one by one. For each row, it runs the toAppointmentContract function to clean up the data (like formatting dates and removing any sensitive info) before sending it back to the client.
      //toAppointmentContract: This function acts like a filter, transforming each database row into a clean format ("contract") that contains only
      meta: {  //meta: "metadata". This starts a sub-object dedicated to holding data about your data. Instead of raw appointments, it holds details regarding how the appointment list is organized
        page: (req.query as any).page, //page: Grabs the page number the user requested from the URL (e.g., Page 2) and mirrors it back in the response.
        limit: (req.query as any).limit, //limit:Grabs the layout limit amount the user requested from the URL (e.g., 10 items per page) and mirrors it back.
        total, //total,: This sends back the total number of matching rows across your entire database table.
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