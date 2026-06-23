import { Router } from "express";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { AUTH_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { authMiddleware } from "./auth.middleware.js";
import { authController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

router.post(
  AUTH_ENDPOINTS.register,
  validateRequest(registerSchema),
  authController.register
);
router.post(AUTH_ENDPOINTS.login, validateRequest(loginSchema), authController.login);
router.get(AUTH_ENDPOINTS.me, authMiddleware, authController.me);

export const authRoutes = router;
