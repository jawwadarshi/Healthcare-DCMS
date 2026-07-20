export const API_VERSION = "v1" as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const MODULE_ROUTES = {
  auth: "/auth",
  patients: "/patients",
  appointments: "/appointments",
  treatmentHistory: "/treatment-history",
  billing: "/billing",
  services: "/services",
  users: "/users",
  rbac: "/rbac",
  whatsapp: "/whatsapp",
  feedback: "/feedback",
  receptionist: "/receptionist",
  ai: "/ai",
} as const;

export const AUTH_ENDPOINTS = {
  register: "/register",
  login: "/login",
  me: "/me",
} as const;

export const RECEPTIONIST_ENDPOINTS = {
  ask: "/ask",
} as const;

export const RBAC_EXAMPLE_ENDPOINTS = {
  adminOnly: "/admin-only",
  doctorOnly: "/doctor-only",
  staffOnly: "/staff-only",
  adminDoctor: "/admin-doctor",
} as const;

export const PATIENTS_ENDPOINTS = {
  root: "/",
  byId: "/:id",
} as const;

export const SERVICES_ENDPOINTS = {
  root: "/",
  byId: "/:id",
} as const;

export const USERS_ENDPOINTS = {
  root: "/",
  byId: "/:id",
} as const;

export const APPOINTMENTS_ENDPOINTS = {
  root: "/",
  byId: "/:id",
  publicBooking: "/public-booking",
  complete: "/:id/complete",
} as const;

export const TREATMENT_HISTORY_ENDPOINTS = {
  root: "/",
  byId: "/:id",
  byPatientId: "/patient/:patientId",
  byAppointmentId: "/appointment/:appointmentId",
  patients: "/patients",
} as const;

export const BILLING_ENDPOINTS = {
  invoices: "/invoices",
  invoiceById: "/invoices/:id",
  createInvoice: "/invoices",
  updatePaymentStatus: "/invoices/:id/payment-status",
  getPatientInvoices: "/invoices/patient/:patientId",
} as const;

export const WHATSAPP_ENDPOINTS = {
  webhook: "/webhook",
} as const;

export const AI_ENDPOINTS = {
  parseScribe: "/parse-scribe", // 👈 Endpoint to turn doctor's speech to JSON
} as const;
