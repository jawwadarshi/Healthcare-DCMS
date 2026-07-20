import { Router } from "express";
import { aiController } from "./ai.controller.js";
import { AI_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { validateRequest } from "../../common/middleware/validate-request.js"; // Replace with your validate request middleware import path if different
import { parseScribeSchema } from "./ai.validation.js";

const router = Router();

// Add your auth middleware if you only want authenticated Doctors to call this
//router.post(AI_ENDPOINTS.parseScribe,validateRequest(parseScribeSchema),aiController.parseScribe);

router.post(
    AI_ENDPOINTS.parseScribe,
    aiController.parseScribe
);

export const aiRoutes = router;