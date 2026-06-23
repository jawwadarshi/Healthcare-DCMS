import { Router } from "express";
import { WHATSAPP_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { whatsappController } from "./whatsapp.controller.js";

const router = Router();
//one GET route for webhook verification, one POST route for receiving messages.

router.get(WHATSAPP_ENDPOINTS.webhook, whatsappController.verifyWebhook);
router.post(WHATSAPP_ENDPOINTS.webhook, whatsappController.receiveWebhook);

export const whatsappRoutes = router;
