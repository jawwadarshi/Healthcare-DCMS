import type { ApiSuccessResponse } from "./common.contract.js";

export type ServiceContract = {
  id: string;
  name: string;
  description: string;
  durationInMinutes: number;
  basePrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceRequestContract = {
  name: string;
  description: string;
  durationInMinutes: number;
  basePrice: string;
};

export type UpdateServiceRequestContract = Partial<CreateServiceRequestContract>;

export type ListServicesQueryContract = Partial<{
  page: string;
  limit: string;
  search: string;
  isActive: string;
  sortBy: "name" | "createdAt" | "basePrice";
  sortOrder: "asc" | "desc";
}>;

export type ServicesListDataContract = {
  items: ServiceContract[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ServiceResponseContract = ApiSuccessResponse<ServiceContract>;
export type ServicesListResponseContract = ApiSuccessResponse<ServicesListDataContract>;
export type ServiceDeleteResponseContract = ApiSuccessResponse<{ id: string }>;
