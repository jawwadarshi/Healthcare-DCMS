import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
//import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import jwt from "jsonwebtoken";
const { JsonWebTokenError, TokenExpiredError } = jwt;
import { AppError } from "../errors/app-error.js";
import { sendErrorResponse } from "../utils/api-response.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("DEBUG ERROR: found at ", err);
  if (err instanceof AppError) {
    return sendErrorResponse(res, err.message, err.statusCode, undefined, err.name);
  }

  if (err instanceof ZodError) {
    return sendErrorResponse(
      res,
      "Validation failed",
      400,
      err.issues,
      "ValidationError"
    );
  }

  if (err instanceof TokenExpiredError) {
    return sendErrorResponse(res, "Token expired", 401, undefined, "TokenExpiredError");
  }

  if (err instanceof JsonWebTokenError) {
    return sendErrorResponse(res, "Invalid token", 401, undefined, "JsonWebTokenError");
  }
  console.error("DEBUG ERROR:", err);
  return sendErrorResponse(res, "Internal server error", 500, undefined, "InternalServerError");
};
