import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { treatmentHistoryService } from "./treatment-history.service.js";
import type { TreatmentHistoryRow, TreatmentHistoryServiceRow } from "./treatment-history.repository.js";

// Contract conversion helper
const toTreatmentHistoryContract = (
    history: TreatmentHistoryRow & { services: TreatmentHistoryServiceRow[] }
) => {
    return {
        id: history.id,
        patientId: history.patientId,
        appointmentId: history.appointmentId,
        doctorId: history.doctorId,
        diagnosis: history.diagnosis,
        prescription: history.prescription,
        notes: history.notes,
        treatmentDate: history.treatmentDate.toString(),
        services: history.services.map((s) => ({
            id: s.id,
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            servicePrice: s.servicePrice,
            quantity: s.quantity,
        })),
        createdBy: history.createdBy,
        createdAt: history.createdAt.toISOString(),
        updatedAt: history.updatedAt.toISOString(),
    };
};

export class TreatmentHistoryController {
    // Complete appointment and create treatment history
    completeTreatment = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);
        const result = await treatmentHistoryService.completeTreatment(req.user.userId, req.body);
        if (!result) throw new AppError("Failed to create treatment history", 500);
        return sendSuccessResponse(
            res,
            "Treatment history created successfully",
            toTreatmentHistoryContract(result),
            201
        );
    });

    // Get treatment history by ID
    getById = asyncHandler(async (req, res) => {
        const history = await treatmentHistoryService.getTreatmentHistoryById(req.params.id as string);
        return sendSuccessResponse(
            res,
            "Treatment history fetched successfully",
            toTreatmentHistoryContract(history)
        );
    });

    // Get treatment history by appointment ID
    getByAppointmentId = asyncHandler(async (req, res) => {
        const history = await treatmentHistoryService.getTreatmentHistoryByAppointmentId(
            req.params.appointmentId as string
        );
        return sendSuccessResponse(
            res,
            "Treatment history fetched successfully",
            toTreatmentHistoryContract(history)
        );
    });

    // List distinct patients with treatment history
    listTreatmentPatients = asyncHandler(async (req, res) => {
        const { items, total } = await treatmentHistoryService.listTreatmentPatients(req.query as any);

        return sendSuccessResponse(res, "Treatment patients fetched successfully", {
            items,
            meta: {
                page: Number((req.query as any).page) || 1,
                limit: Number((req.query as any).limit) || 20,
                total,
            },
        });
    });

    // List patient's treatment history
    listByPatientId = asyncHandler(async (req, res) => {
        const { items, total } = await treatmentHistoryService.listPatientTreatmentHistory(
            req.params.patientId as string,
            req.query as any
        );

        return sendSuccessResponse(res, "Treatment history fetched successfully", {
            items: items.map(toTreatmentHistoryContract),
            meta: {
                page: (req.query as any).page,
                limit: (req.query as any).limit,
                total,
            },
        });
    });
}

export const treatmentHistoryController = new TreatmentHistoryController();
