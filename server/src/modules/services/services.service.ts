/*import { AppError } from "../../common/errors/app-error.js";
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from "./services.validation.js";
import { servicesRepository } from "./services.repository.js";

export class ServicesService {
  async createService(payload: CreateServiceInput) {
    return await servicesRepository.create(payload);
  }

  async listServices(query: ListServicesQuery) {
    return await servicesRepository.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getServiceById(id: string) {
    const service = await servicesRepository.findById(id);
    if (!service) {
      throw new AppError("Dental service not found", 404);
    }
    return service;
  }


  async updateService(id: string, payload: UpdateServiceInput) {
    const updated = await servicesRepository.updateById(id, payload);
    if (!updated) {
      throw new AppError("Service not found", 404);
    }
    return updated;
  }

  async deleteService(id: string) {
    const deleted = await servicesRepository.deleteById(id);
    if (!deleted) {
      throw new AppError("Service not found", 404);
    }
    return deleted;
  }
}

export const servicesService = new ServicesService();
*/
import { AppError } from "../../common/errors/app-error.js";
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from "./services.validation.js";
import { servicesRepository } from "./services.repository.js";

export class ServicesService {
  async createService(payload: CreateServiceInput) {
    return await servicesRepository.create(payload);
  }

  async listServices(query: ListServicesQuery) {
    return await servicesRepository.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getServiceById(id: string) {
    const service = await servicesRepository.findById(id);

    // Narrowing: If service is undefined, we throw. 
    // Below this block, 'service' is no longer 'undefined'.
    if (!service) {
      throw new AppError("Dental service not found", 404);
    }
    return service;
  }

  async updateService(id: string, payload: UpdateServiceInput) {
    // We clean the payload to remove explicit 'undefined' values 
    // to satisfy 'exactOptionalPropertyTypes'
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const updated = await servicesRepository.updateById(id, cleanedPayload);

    if (!updated) {
      throw new AppError("Service not found or could not be updated", 404);
    }
    return updated;
  }

  async deleteService(id: string) {
    const deleted = await servicesRepository.deleteById(id);

    if (!deleted) {
      throw new AppError("Service not found", 404);
    }
    return deleted;
  }
}

export const servicesService = new ServicesService();
