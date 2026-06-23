import { Router } from "express";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { createFeedbackSchema } from "./feedback.validation.js";
import { feedbackController } from "./feedback.controller.js";

export const feedbackRoutes = Router();

// POST /feedback - Public feedback submission (no auth required)
feedbackRoutes.post(
    "/",
    validateRequest(createFeedbackSchema),
    feedbackController.createFeedback
);