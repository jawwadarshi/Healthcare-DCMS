import { Router } from "express";
import { AppRole } from "../../common/constants/roles.js";
import { authenticate, authorizeRoles } from "../../common/middleware/rbac.middleware.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { USERS_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { usersController } from "./users.controller.js";
import { getUserByIdSchema, listUsersSchema } from "./users.validation.js";

const router = Router();

router.get(
  USERS_ENDPOINTS.root,
  authenticate,
  authorizeRoles(AppRole.ADMIN),
  validateRequest(listUsersSchema),
  usersController.list
);

router.get(
  USERS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(AppRole.ADMIN),
  validateRequest(getUserByIdSchema),
  usersController.getById
);

export const usersRoutes = router;
