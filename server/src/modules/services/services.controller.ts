import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { servicesService } from "./services.service.js";
import type { ServiceRow } from "./services.repository.js";

const toIsoDateTime = (value: Date | null): string | null => (value ? value.toISOString() : null);

const toServiceContract = (row: ServiceRow) => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationInMinutes: row.durationInMinutes,
    basePrice: row.basePrice == null ? null : row.basePrice.toString(),
    isActive: row.isActive,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  };
};

export class ServicesController {
  create = asyncHandler(async (req, res) => {
    const created = await servicesService.createService(req.body);
    return sendSuccessResponse(res, "Service created successfully", toServiceContract(created), 201);
  });

  list = asyncHandler(async (req, res) => {
    const { items, total } = await servicesService.listServices(req.query as any);
    return sendSuccessResponse(res, "Services fetched successfully", {
      items: items.map(toServiceContract),
      meta: {
        page: (req.query as any).page,
        limit: (req.query as any).limit,
        total,
      },
    });
  });

  getById = asyncHandler(async (req, res) => {
    const service = await servicesService.getServiceById(req.params.id as string);
    return sendSuccessResponse(res, "Service fetched successfully", toServiceContract(service));
  });

  update = asyncHandler(async (req, res) => {
    const updated = await servicesService.updateService(req.params.id as string, req.body);
    return sendSuccessResponse(res, "Service updated successfully", toServiceContract(updated));
  });

  delete = asyncHandler(async (req, res) => {
    const deleted = await servicesService.deleteService(req.params.id as string);
    return sendSuccessResponse(res, "Service deleted successfully", { id: deleted.id });
  });
}

export const servicesController = new ServicesController();
