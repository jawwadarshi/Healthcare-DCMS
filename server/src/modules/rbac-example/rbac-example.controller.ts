import { asyncHandler } from "../../common/utils/async-handler";
import { sendSuccessResponse } from "../../common/utils/api-response";
import { rbacExampleService } from "./rbac-example.service";

export class RbacExampleController {
  adminOnly = asyncHandler(async (_req, res) => {
    return sendSuccessResponse(
      res,
      "Admin route access granted",
      rbacExampleService.adminOnly()
    );
  });

  doctorOnly = asyncHandler(async (_req, res) => {
    return sendSuccessResponse(
      res,
      "Doctor route access granted",
      rbacExampleService.doctorOnly()
    );
  });

  staffOnly = asyncHandler(async (_req, res) => {
    return sendSuccessResponse(
      res,
      "Staff route access granted",
      rbacExampleService.staffOnly()
    );
  });

  adminDoctorShared = asyncHandler(async (_req, res) => {
    return sendSuccessResponse(
      res,
      "Admin/Doctor shared route access granted",
      rbacExampleService.adminDoctorShared()
    );
  });
}

export const rbacExampleController = new RbacExampleController();
