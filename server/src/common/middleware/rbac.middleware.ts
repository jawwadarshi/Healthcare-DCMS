import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error.js";
import { ForbiddenError, UnauthorizedError } from "../errors/http-errors.js";
import { isAppRole, type AppRole } from "../constants/roles.js";
import type { JwtPayload } from "../types/auth.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  // We only accept Bearer tokens for consistency across all modules.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Unauthorized: token is missing"));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new UnauthorizedError("Unauthorized: token is missing"));
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError("JWT_SECRET is not configured", 500));
  }

  try {
    const decoded = jwt.verify(token, secret) as Partial<JwtPayload>;

    // Explicit role validation prevents privilege escalation via malformed tokens.
    if (!decoded.userId || !decoded.email || !decoded.role || !isAppRole(decoded.role)) {
      return next(new UnauthorizedError("Unauthorized: invalid token payload"));
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      doctorId: decoded.doctorId,
    };

    return next();
  } catch (_error) {
    return next(new UnauthorizedError("Unauthorized: invalid or expired token"));
  }
};

export const authorizeRoles = (...allowedRoles: AppRole[]): RequestHandler => {
  return (req, _res, next) => {
    // authenticate should run before authorizeRoles and attach req.user.
    if (!req.user) {
      return next(new UnauthorizedError("Unauthorized: authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: ${req.user.role} role cannot access this resource`
        )
      );
    }

    return next();
  };
};
