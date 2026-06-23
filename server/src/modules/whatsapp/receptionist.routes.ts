import { Router } from "express";
import { receptionistController } from "./receptionist.controller.js";
import { RECEPTIONIST_ENDPOINTS } from "../../contracts/api-routes.contract.js";

const router = Router();

// Public — no auth, used by website widget
router.post(RECEPTIONIST_ENDPOINTS.ask, receptionistController.ask);

export const receptionistRoutes = router;