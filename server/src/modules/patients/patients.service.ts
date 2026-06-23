import { AppError } from "../../common/errors/app-error.js";
import type { CreatePatientInput, ListPatientsQuery, UpdatePatientInput } from "./patients.validation.js";
import { patientsRepository } from "./patients.repository.js";

export class PatientsService {
  async createPatient(createdBy: string, payload: CreatePatientInput) {
    return await patientsRepository.create({
      ...payload,
      dateOfBirth: payload.dateOfBirth,
      createdBy,
    });
  }

  async listPatients(query: ListPatientsQuery) {
    return await patientsRepository.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getPatientById(id: string) {
    const patient = await patientsRepository.findById(id);
    if (!patient) {
      throw new AppError("Patient not found", 404);
    }
    return patient;
  }

  async updatePatient(id: string, payload: UpdatePatientInput) {
    const updated = await patientsRepository.updateById(id, payload);
    if (!updated) {
      throw new AppError("Patient not found", 404);
    }
    return updated;
  }

  async deletePatient(id: string) {
    const deleted = await patientsRepository.deleteById(id);
    if (!deleted) {
      throw new AppError("Patient not found", 404);
    }
    return deleted;
  }
}

export const patientsService = new PatientsService();
