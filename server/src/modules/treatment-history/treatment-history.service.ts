import { AppError } from "../../common/errors/app-error.js";
import { db } from "../../db/index.js";
import { appointments, services, patients } from "../../db/schema.js";
import { inArray, eq } from "drizzle-orm";
import { treatmentHistoryRepository, type TreatmentHistoryServiceRow } from "./treatment-history.repository.js";
import type { CompleteTreatmentInput, GetTreatmentHistoryByPatientQuery, ListTreatmentPatientsQuery } from "./treatment-history.validation.js";
import { whatsappAutomationService } from "../whatsapp/whatsapp-automation.service.js";

export class TreatmentHistoryService {

    // Complete an appointment and create treatment history
    //Includes multiple services and medical details

    async completeTreatment(createdBy: string, payload: CompleteTreatmentInput) {
        // Validate appointment exists and is not already completed
        const appointment = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, payload.appointmentId))
            .limit(1);

        if (!appointment[0]) {
            throw new AppError("Appointment not found", 404);
        }

        if (appointment[0].status === "completed") {
            throw new AppError("Appointment is already completed", 400);
        }

        // Validate all services exist and get their details
        const serviceList = await db
            .select()
            .from(services)
            .where(inArray(services.id, payload.serviceIds));

        if (serviceList.length !== payload.serviceIds.length) {
            throw new AppError("One or more services not found", 404);
        }

        // Validate patient exists or create from appointment details
        let patientId = appointment[0].patientId;

        if (!patientId) {
            // Try to find existing patient by phone
            const existingPatient = await db
                .select()
                .from(patients)
                .where(eq(patients.phone, appointment[0].patientPhone))
                .limit(1);

            if (existingPatient[0]) {
                patientId = existingPatient[0].id;
            } else {
                // Auto-create patient from appointment details
                const nameParts = appointment[0].patientName.split(' ');
                const firstName = nameParts[0] || 'Unknown';
                const lastName = nameParts.slice(1).join(' ') || 'Patient';

                // Use current year as default DOB for auto-created patients
                const currentYear = new Date().getFullYear();
                const defaultDob = `${currentYear - 30}-01-01`;

                const newPatient = await db
                    .insert(patients)
                    .values({
                        firstName,
                        lastName,
                        phone: appointment[0].patientPhone,
                        email: appointment[0].patientEmail || undefined,
                        gender: 'other',
                        dateOfBirth: defaultDob as any,
                        address: 'Auto-created from appointment',
                        medicalHistory: 'No medical history recorded',
                        allergies: 'None recorded',
                        emergencyContactName: firstName,
                        emergencyContactPhone: appointment[0].patientPhone,
                        createdBy: createdBy,
                    })
                    .returning();

                if (newPatient[0]) {
                    patientId = newPatient[0].id;
                } else {
                    throw new AppError("Failed to create patient record", 500);
                }
            }
        }

        // Create treatment history
        const treatmentHistory = await treatmentHistoryRepository.create({
            patientId: patientId as string,
            appointmentId: payload.appointmentId,
            doctorId: appointment[0].doctorId ?? createdBy,
            diagnosis: payload.diagnosis,
            prescription: payload.prescription,
            notes: payload.notes,
            treatmentDate: appointment[0].appointmentDate,
            createdBy,
        });

        // Add services to treatment history
        const treatmentServices: Omit<TreatmentHistoryServiceRow, "id" | "treatmentHistoryId" | "createdAt">[] = serviceList.map((service) => ({
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.basePrice,
            quantity: 1,
        }));

        await treatmentHistoryRepository.addServices(
            treatmentHistory.id,
            treatmentServices as TreatmentHistoryServiceRow[]
        );

        // Mark appointment as completed
        await db
            .update(appointments)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(appointments.id, payload.appointmentId));

        whatsappAutomationService.scheduleSentimentCheck(
            appointment[0].patientPhone,
            appointment[0].patientName,
            appointment[0].id
        );

        // Fetch and return complete treatment history with services
        return await treatmentHistoryRepository.findById(treatmentHistory.id);
    }

    /**
     * Get treatment history by ID
     */
    async getTreatmentHistoryById(id: string) {
        const history = await treatmentHistoryRepository.findById(id);
        if (!history) {
            throw new AppError("Treatment history not found", 404);
        }
        return history;
    }

    /**
     * Get treatment history by appointment ID
     */
    async getTreatmentHistoryByAppointmentId(appointmentId: string) {
        const history = await treatmentHistoryRepository.findByAppointmentId(appointmentId);
        if (!history) {
            throw new AppError("Treatment history not found for this appointment", 404);
        }
        return history;
    }

    /**
     * List distinct patients with treatment history
     */
    async listTreatmentPatients(query: ListTreatmentPatientsQuery) {
        return await treatmentHistoryRepository.listPatientsWithTreatments({
            page: query.page,
            limit: query.limit,
            search: query.search,
        });
    }

    /**
     * List patient's treatment history
     */
    async listPatientTreatmentHistory(patientId: string, query: GetTreatmentHistoryByPatientQuery) {
        // Validate patient exists
        const patient = await db
            .select()
            .from(patients)
            .where(eq(patients.id, patientId))
            .limit(1);

        if (!patient[0]) {
            throw new AppError("Patient not found", 404);
        }

        return await treatmentHistoryRepository.listByPatientId(patientId, {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
    }
}




export const treatmentHistoryService = new TreatmentHistoryService();
