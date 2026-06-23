import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { whatsappAutomationService } from "./whatsapp-automation.service.js";
import { whatsappService } from "./whatsapp.service.js";

export class WhatsAppController {
  verifyWebhook = asyncHandler(async (req, res) => {
    const challenge = whatsappService.verifyWebhook(
      req.query["hub.mode"],
      req.query["hub.verify_token"],
      req.query["hub.challenge"]
    );

    if (!challenge) {
      throw new AppError("WhatsApp webhook verification failed", 403);
    }

    return res.status(200).send(challenge);
  });

  receiveWebhook = asyncHandler(async (req, res) => {
    console.log("[DEBUG] receiveWebhook called");
    console.log("[DEBUG] req.body:", JSON.stringify(req.body, null, 2));
    void whatsappAutomationService.processWebhook(req.body).catch((error) => {
      console.error(
        "WhatsApp webhook processing failed",
        error instanceof Error ? error.message : error
      );
    });

    return sendSuccessResponse(res, "WhatsApp webhook received", { received: true });
  });
}

export const whatsappController = new WhatsAppController();
