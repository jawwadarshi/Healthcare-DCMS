import type { Response } from "express";

type SuccessResponsePayload<T> = {
  success: true;
  message: string;
  data: T;
};

type ErrorResponsePayload = {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
  path?: string;
  timestamp: string;
};

export const sendSuccessResponse = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200
) => {
  const payload: SuccessResponsePayload<T> = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(payload);
};

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
  code?: string
) => {
  const payload: ErrorResponsePayload = {
    success: false,
    message,
    ...(code !== undefined && { code }),
    ...(errors !== undefined && { errors }),
    path: res.req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
};
