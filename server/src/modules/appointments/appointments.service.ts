import { AppError } from "../../common/errors/app-error.js";
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
  PublicBookingInput,
  UpdateAppointmentInput,
} from "./appointments.validation.js";
import { appointmentsRepository } from "./appointments.repository.js";
import { db } from "../../db/index.js";
import { users, services, appointments } from "../../db/schema.js";
import { eq, and, or, ne, inArray } from "drizzle-orm";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { whatsappAutomationService } from "../whatsapp/whatsapp-automation.service.js";
import { emitNewAppointment } from "../../socket/index.js";

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

  private validateAppointmentDateTime(appointmentDate: string, appointmentTime: string): void {
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
      ...payload,
      doctorId: null,
      patientId: null,
      createdBy,
    });

    this.notifyWhatsApp(whatsappService.sendAppointmentBooked(appointment));
    emitNewAppointment(payload.patientName, payload.appointmentDate, payload.appointmentTime);
    return appointment;
  }

  async createAppointment(createdBy: string, payload: CreateAppointmentInput) {
    await this.validateDoctor(payload.doctorId);
    await this.validateService(payload.serviceId);
    this.validateAppointmentDateTime(payload.appointmentDate, payload.appointmentTime);

    // Double-booking check
    await this.checkDoctorAvailability(payload.doctorId, payload.appointmentDate, payload.appointmentTime);

    const appointment = await appointmentsRepository.create({
      ...payload,
      patientId: null,
      createdBy,
    });

    this.notifyWhatsApp(whatsappService.sendAppointmentBooked(appointment));
    emitNewAppointment(payload.patientName, payload.appointmentDate, payload.appointmentTime);
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
      whatsappAutomationService.scheduleSentimentCheck(
        updated.patientPhone,
        updated.patientName,
        updated.id
      );
    }

    return updated;
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
