import { Router } from "express";
import { AppRole } from "../../common/constants/roles.js";
import { authenticate, authorizeRoles } from "../../common/middleware/rbac.middleware.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { SERVICES_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { servicesController } from "./services.controller.js";
import {
  createServiceSchema,
  deleteServiceSchema,
  getServiceByIdSchema,
  listServicesSchema,
  updateServiceSchema,
} from "./services.validation.js";

const router = Router();

// RBAC rules:
// - admin: full access (create, read, update, delete)
// - staff: read-only (get list, get by id)
// - doctor: read-only (get list, get by id)
// - patient: read-only (get list, get by id)

const fullAccessRoles = [AppRole.ADMIN] as const;
const readOnlyRoles = [AppRole.ADMIN, AppRole.STAFF, AppRole.DOCTOR, AppRole.PATIENT] as const;

router.post(
  SERVICES_ENDPOINTS.root,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(createServiceSchema),
  servicesController.create
);

router.get(
  SERVICES_ENDPOINTS.root,
  //authenticate,
  //authorizeRoles(...readOnlyRoles),
  validateRequest(listServicesSchema),
  servicesController.list
);

router.get(
  SERVICES_ENDPOINTS.byId,
  //authenticate,
  //authorizeRoles(...readOnlyRoles),
  validateRequest(getServiceByIdSchema),
  servicesController.getById
);

router.patch(
  SERVICES_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(updateServiceSchema),
  servicesController.update
);

router.delete(
  SERVICES_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(deleteServiceSchema),
  servicesController.delete
);

export const servicesRoutes = router;
