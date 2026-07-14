import { AppError } from "../../common/errors/app-error.js";
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
  PublicBookingInput,
  UpdateAppointmentInput,
} from "./appointments.validation.js";
import { appointmentsRepository } from "./appointments.repository.js";
import { db } from "../../db/index.js";
import { users, services, appointments, invoices, invoiceItems, treatmentHistories } from "../../db/schema.js";
import { eq, and, or, ne, inArray } from "drizzle-orm";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { whatsappAutomationService } from "../whatsapp/whatsapp-automation.service.js";
import { emitNewAppointment } from "../../socket/index.js";
import { generateInvoicePdf } from "../../common/utils/pdf-generator.js";

export class AppointmentsService {
  private notifyWhatsApp(task: Promise<void>): void {
    task.catch((error) => {
      console.error("Failed to send WhatsApp notification", error);
    });
  }

  private async validateDoctor(doctorId: string): Promise<void> {
    const doctor = await db.select().from(users).where(eq(users.id, doctorId)).limit(1);
    if (!doctor.length) {
      throw new AppError("Doctor not found", 404);
    }
  }

  private async validateService(serviceId: string): Promise<void> {
    const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service.length) {
      throw new AppError("Service not found", 404);
    }
  }

  private validateAppointmentDateTime(appointmentDate?: string, appointmentTime?: string): void {
    if (!appointmentDate || !appointmentTime) {
      throw new AppError("Appointment date and time are required", 400);
    }

    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);

    if (appointmentDateTime < now) {
      throw new AppError("Appointment date and time cannot be in the past", 400);
    }
  }

  /**
   * Double-booking prevention: check if an active appointment
   * already exists for the same doctor at the same time slot.
   */
  private async checkDoctorAvailability(doctorId: string, appointmentDate: string, appointmentTime: string): Promise<void> {
    const cancelledStatuses: string[] = ["cancelled", "no_show"];
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.appointmentDate, appointmentDate),
          eq(appointments.appointmentTime, appointmentTime),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "no_show")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new AppError(
        "Doctor is already booked for this date and time slot. Please select a different time or doctor.",
        409
      );
    }
  }

  async createPublicBooking(createdBy: string | null, payload: PublicBookingInput) {
    await this.validateService(payload.serviceId);
    this.validateAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);

    const appointment = await appointmentsRepository.create({
      // ensure required fields are provided to repository by defaulting optional values
      serviceId: payload.serviceId,
      patientName: payload.patientName,
      patientPhone: payload.patientPhone,
      patientEmail: payload.patientEmail ?? "",
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime ?? "",
      notes: payload.notes ?? "",
      doctorId: null,
      patientId: null,
      createdBy,
    });

    this.notifyWhatsApp(whatsappService.sendAppointmentBooked(appointment));
    emitNewAppointment(payload.patientName, payload.appointmentDate, payload.appointmentTime ?? "");
    return appointment;
  }

  async createAppointment(createdBy: string, payload: CreateAppointmentInput) {
    await this.validateDoctor(payload.doctorId);
    await this.validateService(payload.serviceId);
    this.validateAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);

    // Double-booking check
    await this.checkDoctorAvailability(payload.doctorId, payload.appointmentDate, payload.appointmentTime ?? "");

    const appointment = await appointmentsRepository.create({
      ...payload,
      patientEmail: payload.patientEmail ?? "",
      appointmentTime: payload.appointmentTime ?? "",
      patientId: null,
      createdBy,
    });

    this.notifyWhatsApp(whatsappService.sendAppointmentBooked(appointment));
    emitNewAppointment(payload.patientName, payload.appointmentDate, payload.appointmentTime ?? "");
    return appointment;
  }

  async listAppointments(query: ListAppointmentsQuery) {
    return await appointmentsRepository.list({
      page: query.page,
      limit: query.limit,
      status: query.status,
      doctorId: query.doctorId,
      patientId: query.patientId,
      appointmentDate: query.appointmentDate,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getAppointmentById(id: string) {
    const appointment = await appointmentsRepository.findById(id);
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }
    return appointment;
  }

  async updateAppointment(id: string, payload: UpdateAppointmentInput) {
    if (payload.doctorId) {
      await this.validateDoctor(payload.doctorId);
    }

    if (payload.appointmentDate && payload.appointmentTime) {
      this.validateAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);
    }

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const updated = await appointmentsRepository.updateById(id, cleanedPayload);

    if (!updated) {
      throw new AppError("Appointment not found or could not be updated", 404);
    }

    this.notifyWhatsApp(whatsappService.sendAppointmentUpdated(updated));

    if (payload.status === "completed") {
      // Schedule sentiment check
      whatsappAutomationService.scheduleSentimentCheck(
        updated.patientPhone,
        updated.patientName,
        updated.id
      );

      // ─── Invoice WhatsApp Dispatch (fire-and-forget) ──────────────────
      this.sendInvoiceOnAppointmentCompletion(updated).catch((error) => {
        console.error(
          `[Appointments] Failed to send invoice WhatsApp for appointment ${updated.id}:`,
          error
        );
      });
    }

    return updated;
  }

  /**
   * Fire-and-forget: find the invoice for the completed appointment and
   * send the summary + PDF to the patient via WhatsApp.
   *
   * The lookup chain is: appointment → treatmentHistory → invoice
   */
  private async sendInvoiceOnAppointmentCompletion(
    appointment: import("./appointments.repository.js").AppointmentRow
  ): Promise<void> {
    console.log(`[Appointments] sendInvoiceOnAppointmentCompletion started for appointment ${appointment.id}`);

    // Step 1: Find the treatment history linked to this appointment
    const treatmentHistoryRecord = await db
      .select()
      .from(treatmentHistories)
      .where(eq(treatmentHistories.appointmentId, appointment.id))
      .limit(1);

    if (!treatmentHistoryRecord.length) {
      console.warn(
        `[Appointments] No treatment history found for completed appointment ${appointment.id}. Cannot look up invoice.`
      );
      return;
    }

    const treatmentHistory = treatmentHistoryRecord[0]!;
    console.log(`[Appointments] Found treatment history ${treatmentHistory.id} for appointment ${appointment.id}`);

    // Step 2: Find the invoice linked to this treatment history
    const invoiceRecord = await db
      .select()
      .from(invoices)
      .where(eq(invoices.treatmentHistoryId, treatmentHistory.id))
      .limit(1);

    if (!invoiceRecord.length) {
      console.warn(
        `[Appointments] No invoice found for treatment history ${treatmentHistory.id} (appointment ${appointment.id})`
      );
      return;
    }

    const invoice = invoiceRecord[0]!;
    console.log(`[Appointments] Found invoice ${invoice.invoiceNumber} for appointment ${appointment.id}`);

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    // Build summary message
    const clinicName = process.env.CLINIC_NAME ?? "Dental Clinic";
    const summary = [
      `🧾 *Invoice from ${clinicName}*`,
      ``,
      `Patient: ${appointment.patientName}`,
      `Invoice #: ${invoice.invoiceNumber}`,
      `Total Amount: $${invoice.total}`,
      `Paid Amount: $${invoice.paymentStatus === "paid" ? invoice.total : "0.00"}`,
      `Remaining Balance: ${invoice.paymentStatus === "paid"
        ? "0.00"
        : invoice.paymentStatus === "partially_paid"
          ? invoice.total
          : invoice.total
      }`,
      `Status: ${invoice.paymentStatus}`,
      ``,
      `Thank you for choosing ${clinicName}!`,
    ].join("\n");

    // Generate PDF
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        patientEmail: appointment.patientEmail,
        clinicName,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        subtotal: invoice.subtotal,
        discount: invoice.discount ?? "0",
        total: invoice.total,
        issuedDate: invoice.issuedDate.toISOString().split("T")[0] ?? invoice.issuedDate.toISOString(),
      });
      console.log(`[Appointments] PDF generated successfully for invoice ${invoice.id}`);
    } catch (pdfError) {
      console.error(
        `[Appointments] Failed to generate PDF for invoice ${invoice.id}:`,
        pdfError
      );
      // Continue without PDF
    }

    // Send WhatsApp - wrap in try/catch so it does NOT crash the completion
    try {
      console.log(`[Appointments] Sending WhatsApp invoice to ${appointment.patientPhone}`);
      await whatsappService.sendInvoiceSummary(
        appointment.patientPhone,
        summary,
        pdfBuffer
      );
      console.info(
        `[Appointments] Invoice WhatsApp sent for appointment ${appointment.id}`
      );
    } catch (waError) {
      console.error(
        `[Appointments] Failed to send invoice WhatsApp for appointment ${appointment.id}:`,
        waError
      );
    }
  }

  async deleteAppointment(id: string) {
    const deleted = await appointmentsRepository.deleteById(id);
    if (!deleted) {
      throw new AppError("Appointment not found", 404);
    }
    return deleted;
  }
}

export const appointmentsService = new AppointmentsService();