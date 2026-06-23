import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { AppError } from "../../common/errors/app-error.js";
import { authService } from "./auth.service.js";

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return sendSuccessResponse(res, "User registered successfully", result, 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return sendSuccessResponse(res, "Login successful", result, 200);
  });

  me = asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await authService.getMe(req.user.userId);
    return sendSuccessResponse(res, "Current user fetched successfully", user, 200);
  });
}

export const authController = new AuthController();
