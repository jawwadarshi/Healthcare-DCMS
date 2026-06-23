import type { ApiSuccessResponse } from "./common.contract.js";

export type PatientGenderContract = "male" | "female" | "other";

export type PatientContract = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  gender: PatientGenderContract;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  address: string;
  medicalHistory: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePatientRequestContract = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: PatientGenderContract;
  dateOfBirth: string; // YYYY-MM-DD
  address: string;
  medicalHistory: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type UpdatePatientRequestContract = Partial<CreatePatientRequestContract>;

export type PatientsListQueryContract = Partial<{
  page: string;
  limit: string;
  search: string;
  sortBy: "createdAt" | "firstName";
  sortOrder: "asc" | "desc";
}>;

export type PatientsListDataContract = {
  items: PatientContract[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type PatientResponseContract = ApiSuccessResponse<PatientContract>;
export type PatientsListResponseContract = ApiSuccessResponse<PatientsListDataContract>;
export type PatientDeleteResponseContract = ApiSuccessResponse<{ id: string }>;
