import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { patientsService } from "./patients.service.js";
import type { PatientRow } from "./patients.repository.js";

const toIsoDateTime = (value: Date): string => value.toISOString();
const toIsoDateOnly = (value: string | Date): string =>
  typeof value === "string" ? value : value.toISOString().slice(0, 10);

const toPatientContract = (row: PatientRow) => {
  // Keep mapping centralized to avoid leaking DB types to the API contract layer.
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    gender: row.gender,
    dateOfBirth: toIsoDateOnly(row.dateOfBirth),
    address: row.address,
    medicalHistory: row.medicalHistory,
    allergies: row.allergies,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    createdBy: row.createdBy,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  };
};

export class PatientsController {
  create = asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const created = await patientsService.createPatient(req.user.userId, req.body);
    return sendSuccessResponse(res, "Patient created successfully", toPatientContract(created), 201);
  });

  list = asyncHandler(async (req, res) => {
    const { items, total } = await patientsService.listPatients(req.query as any);
    return sendSuccessResponse(res, "Patients fetched successfully", {
      items: items.map(toPatientContract),
      meta: {
        page: (req.query as any).page,
        limit: (req.query as any).limit,
        total,
      },
    });
  });

  getById = asyncHandler(async (req, res) => {
    const patient = await patientsService.getPatientById(req.params.id as string);
    return sendSuccessResponse(res, "Patient fetched successfully", toPatientContract(patient));
  });

  update = asyncHandler(async (req, res) => {
    const updated = await patientsService.updatePatient(req.params.id as string, req.body);
    return sendSuccessResponse(res, "Patient updated successfully", toPatientContract(updated));
  });

  delete = asyncHandler(async (req, res) => {
    const deleted = await patientsService.deletePatient(req.params.id as string);;
    return sendSuccessResponse(res, "Patient deleted successfully", { id: deleted.id });
  });
}

export const patientsController = new PatientsController();

