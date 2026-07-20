import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// === MILESTONE 2: ENHANCEMENTS START - Extended Dental Scribe Schema ===
const DentalScribeResultSchema = z.object({
    patientName: z.string().nullable().describe("The patient's name mentioned in the recording."),
    phone: z.string().nullable().describe("The patient's phone number if spoken, or null if missing."),
    toothNumber: z.number().nullable().describe("The targeted tooth number, or null if not mentioned."),
    services: z.array(z.string()).default([]).describe("List of dental services or procedures performed (e.g. Scaling, Root Canal)."),
    diagnosis: z.string().nullable().describe("The diagnostic notes/findings."),
    treatmentDone: z.string().nullable().describe("Immediate treatment or therapy performed today."),
    prescription: z.string().nullable().describe("Medications, dosages, or prescriptions provided to the patient."),
    notes: z.string().nullable().describe("General clinical notes, post-op instructions, or doctor advice."),
    nextAppointmentPlanned: z.string().nullable().describe("Planned procedure for the next visit."),
    followUpInDays: z.number().nullable().describe("Number of days until recommended follow up."),
});
// === MILESTONE 2: ENHANCEMENTS END ===

export class AIService {
    async parseScribeNote(rawText: string) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        console.log("🔑 API Key check:", apiKey ? "Key is Present" : "❌ Key is MISSING!");

        try {
            // === MILESTONE 2: ENHANCEMENTS START - Enhanced Clinical System Prompt ===
            const { object } = await generateObject({
                model: google("gemini-3.1-flash-lite"),
                schema: DentalScribeResultSchema,
                prompt: `You are an expert dental scribe assistant. Translate the following spoken audio transcription from a dentist into a structured clinical record.

Guidelines:
1. Extract the patient's full name if mentioned.
2. Extract phone number if explicitly spoken.
3. Identify targeted tooth numbers if spoken.
4. Categorize performed procedures into the 'services' array (e.g., ["Scaling & Polishing", "Composite Filling"]).
5. Capture clinical diagnoses, prescriptions with dosages, and general post-op instructions or advice into their respective fields.
6. If a field is not mentioned, return null (or an empty array for services).

Transcription:
"${rawText}"`,
            });
            // === MILESTONE 2: ENHANCEMENTS END ===

            return object;
        } catch (error) {
            console.error("AI Service Error parsing note:", error);
            throw error;
        }
    }
}

export const aiService = new AIService();