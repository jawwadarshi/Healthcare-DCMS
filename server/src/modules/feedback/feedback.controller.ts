import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { feedbackService } from "./feedback.service.js";

export class FeedbackController {
    createFeedback = asyncHandler(async (req, res) => {
        const result = await feedbackService.createFeedback(req.body);
        return sendSuccessResponse(res, "Thank you for your feedback!", result, 201);
    });
}

export const feedbackController = new FeedbackController();