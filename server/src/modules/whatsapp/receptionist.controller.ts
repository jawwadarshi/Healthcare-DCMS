import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { whatsappAutomationService } from "./whatsapp-automation.service.js";

export class ReceptionistController {
    ask = asyncHandler(async (req, res) => {
        const { message, sessionId } = req.body as {
            message: string;
            sessionId: string;
        };

        if (!message || !sessionId) {
            return res.status(400).json({ success: false, error: "message and sessionId required" });
        }

        const reply = await whatsappAutomationService.handleWebsiteReceptionist(
            message,
            sessionId
        );

        return sendSuccessResponse(res, "Reply generated", { reply });
    });
}

export const receptionistController = new ReceptionistController();