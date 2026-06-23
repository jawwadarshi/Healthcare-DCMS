import { Router } from "express";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { authenticate } from "../../common/middleware/rbac.middleware.js";
import { treatmentHistoryController } from "./treatment-history.controller.js";
import {
    completeTreatmentSchema,
    getTreatmentHistorySchema,
    getTreatmentHistoryByPatientSchema,
    getTreatmentHistoryByAppointmentSchema,
    listTreatmentPatientsSchema,
} from "./treatment-history.validation.js";
import { TREATMENT_HISTORY_ENDPOINTS } from "../../contracts/api-routes.contract.js";

export const treatmentHistoryRoutes = Router();

// Middleware
treatmentHistoryRoutes.use(authenticate);

// POST /treatment-history - Complete treatment (Doctor/Staff)
treatmentHistoryRoutes.post(
    TREATMENT_HISTORY_ENDPOINTS.root,
    validateRequest(completeTreatmentSchema),
    treatmentHistoryController.completeTreatment
);

// GET /treatment-history/patients - List distinct patients with treatment history
treatmentHistoryRoutes.get(
    TREATMENT_HISTORY_ENDPOINTS.patients,
    validateRequest(listTreatmentPatientsSchema),
    treatmentHistoryController.listTreatmentPatients
);

// GET /treatment-history/patient/:patientId - List patient's treatment history
treatmentHistoryRoutes.get(
    TREATMENT_HISTORY_ENDPOINTS.byPatientId,
    validateRequest(getTreatmentHistoryByPatientSchema),
    treatmentHistoryController.listByPatientId
);

// GET /treatment-history/:id - Get treatment history by ID
treatmentHistoryRoutes.get(
    TREATMENT_HISTORY_ENDPOINTS.byId,
    validateRequest(getTreatmentHistorySchema),
    treatmentHistoryController.getById
);

// GET /treatment-history/appointment/:appointmentId - Get treatment history by appointment ID
treatmentHistoryRoutes.get(
    TREATMENT_HISTORY_ENDPOINTS.byAppointmentId,
    validateRequest(getTreatmentHistoryByAppointmentSchema),
    treatmentHistoryController.getByAppointmentId
);
