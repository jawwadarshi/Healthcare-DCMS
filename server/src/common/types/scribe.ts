export interface ParsedScribePayload {
    patientName: string | null;
    phone: string | null;
    services: string[];
    diagnosis: string | null;
    prescription: string | null;
    notes: string | null;
}