import { AppError } from "./app-error.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: insufficient permissions") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}
