  import { Router } from "express";
import { AppRole } from "../../common/constants/roles";
import { RBAC_EXAMPLE_ENDPOINTS } from "../../contracts/api-routes.contract";
import {
  authenticate,
  authorizeRoles,
} from "../../common/middleware/rbac.middleware";
import { rbacExampleController } from "./rbac-example.controller";

const router = Router();

router.get(
  RBAC_EXAMPLE_ENDPOINTS.adminOnly,
  authenticate,
  authorizeRoles(AppRole.ADMIN),
  rbacExampleController.adminOnly
);

router.get(
  RBAC_EXAMPLE_ENDPOINTS.doctorOnly,
  authenticate,
  authorizeRoles(AppRole.DOCTOR),
  rbacExampleController.doctorOnly
);

router.get(
  RBAC_EXAMPLE_ENDPOINTS.staffOnly,
  authenticate,
  authorizeRoles(AppRole.STAFF),
  rbacExampleController.staffOnly
);

router.get(
  RBAC_EXAMPLE_ENDPOINTS.adminDoctor,
  authenticate,
  authorizeRoles(AppRole.ADMIN, AppRole.DOCTOR),
  rbacExampleController.adminDoctorShared
);

export const rbacExampleRoutes = router;
