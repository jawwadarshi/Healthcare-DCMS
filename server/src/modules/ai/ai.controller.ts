import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { aiService } from "./ai.service.js";
import type { ParseScribeInput } from "./ai.validation.js";
import { db } from "../../db/index.js";
import { eq, and, ilike, or, desc, SQL } from "drizzle-orm";
import { patients } from "../../db/schema.js";
import { appointments } from "../../db/schema.js";
import { treatmentHistories } from "../../db/schema.js";

export class AIController {
    parseScribe = asyncHandler(async (req, res) => {
        const { rawText } = req.body as ParseScribeInput;

        // 1. Get structured JSON from Gemini
        const structuredRecord = await aiService.parseScribeNote(rawText);

        if (!structuredRecord.patientName) {
            return res.status(400).json({
                success: false,
                error: "AI could not recognize a patient name in the transcription."
            });
        }

        // === MILESTONE 2: ENHANCEMENTS START - Flexible Multi-Criteria Patient Matching ===
        // Clean and prepare lookup parameters from Gemini output
        const cleanName = structuredRecord.patientName.trim();
        const extractedPhone = (structuredRecord as any).phone?.trim() || null;

        // Build flexible match conditions: exact/partial first/last name or phone lookup
        const patientSearchConditions: SQL[] = [
            ilike(patients.firstName, `%${cleanName}%`),
            ilike(patients.lastName, `%${cleanName}%`)
        ];

        if (extractedPhone) {
            patientSearchConditions.push(eq(patients.phone, extractedPhone));
        }

        // Query database for the Patient using enhanced multi-field search
        const matchedPatients = await db
            .select()
            .from(patients)
            .where(or(...patientSearchConditions))
            .limit(1);
        // === MILESTONE 2: ENHANCEMENTS END ===

        if (matchedPatients.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Patient '${structuredRecord.patientName}' not found in database.`,
                aiExtractedData: structuredRecord
            });
        }

        const patient = matchedPatients[0]!;

        // 3. Build an array of conditions dynamically for finding appointments
        const conditions: SQL[] = [];

        if (patient.id) {
            conditions.push(eq(appointments.patientId, patient.id));
        }

        if (patient.phone) {
            conditions.push(eq(appointments.patientPhone, patient.phone));
        }

        // Only check email if it actually exists on the patient object
        if (patient.email) {
            conditions.push(eq(appointments.patientEmail, patient.email));
        }

        // Fallback check: Make sure we have at least one valid search parameter
        if (conditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid patient criteria provided for lookup."
            });
        }

        // Run the query with our clean conditions array
        const matchedAppointments = await db
            .select()
            .from(appointments)
            .where(or(...conditions)) // Spreads the array into or()
            .orderBy(desc(appointments.createdAt)) // === MILESTONE 2: Order by newest appointment first
            .limit(1);

        const appointment = matchedAppointments[0] || null;

        // === MILESTONE 2: ENHANCEMENTS START - Rich Field Mapping & Fallbacks ===
        // Extract services array or general notes safely from Gemini payload
        const servicesList = Array.isArray((structuredRecord as any).services)
            ? (structuredRecord as any).services.join(", ")
            : "";

        const extraNotes = (structuredRecord as any).notes || "";
        const toothInfo = (structuredRecord as any).toothNumber ? `Tooth #: ${(structuredRecord as any).toothNumber}. ` : "";

        // Combine notes cleanly
        const combinedNotes = [
            `Extracted via AI Voice Scribe.`,
            toothInfo,
            servicesList ? `Services: ${servicesList}.` : "",
            extraNotes ? `Advice/Notes: ${extraNotes}` : ""
        ].filter(Boolean).join(" ");

        // Save directly into Treatment History table (with optional appointment reference)
        const treatmentHistoryPayload = {
            patientId: patient.id,
            appointmentId: appointment?.id || null, // Gracefully handles direct walk-in voice scribes
            diagnosis: structuredRecord.diagnosis || "Scribe auto-extracted diagnosis",
            prescription: (structuredRecord as any).prescription || "",
            notes: combinedNotes,
            treatmentDate: new Date().toISOString().split("T")[0]!,
            createdBy: (req as any).user?.id || null,
            doctorId: appointment?.doctorId ?? "ai-scribe",
        };
        // === MILESTONE 2: ENHANCEMENTS END ===

        const [newTreatmentRecord] = await db
            .insert(treatmentHistories)
            .values(treatmentHistoryPayload)
            .returning();

        return sendSuccessResponse(res, "Scribe processed and saved to database!", {
            patientName: patient.firstName + " " + patient.lastName,
            appointmentId: appointment?.id || null,
            treatmentRecord: newTreatmentRecord,
            extractedSummary: structuredRecord
        });
    });
}

export const aiController = new AIController();