export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
  path?: string;
  timestamp: string;
};
