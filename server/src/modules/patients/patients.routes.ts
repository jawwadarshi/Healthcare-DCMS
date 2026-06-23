import { Router } from "express";
import { AppRole } from "../../common/constants/roles.js";
import { authenticate, authorizeRoles } from "../../common/middleware/rbac.middleware.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { PATIENTS_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { patientsController } from "./patients.controller.js";
import {
  createPatientSchema,
  deletePatientSchema,
  getPatientByIdSchema,
  listPatientsSchema,
  updatePatientSchema,
} from "./patients.validation.js";

const router = Router();

// RBAC rules:
// - admin/staff: full access
// - doctor: read-only
// - patient: no access

const fullAccessRoles = [AppRole.ADMIN, AppRole.STAFF] as const;
const readOnlyRoles = [AppRole.ADMIN, AppRole.STAFF, AppRole.DOCTOR] as const;

router.post(
  PATIENTS_ENDPOINTS.root,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(createPatientSchema),
  patientsController.create
);

router.get(
  PATIENTS_ENDPOINTS.root,
  authenticate,
  authorizeRoles(...readOnlyRoles),
  validateRequest(listPatientsSchema),
  patientsController.list
);

router.get(
  PATIENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...readOnlyRoles),
  validateRequest(getPatientByIdSchema),
  patientsController.getById
);

router.patch(
  PATIENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(updatePatientSchema),
  patientsController.update
);

router.delete(
  PATIENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...fullAccessRoles),
  validateRequest(deletePatientSchema),
  patientsController.delete
);

export const patientsRoutes = router;

