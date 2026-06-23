import type { AppRole } from "../common/constants/roles.js";
import type { ApiSuccessResponse } from "./common.contract.js";

export type RegisterRequestContract = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequestContract = {
  email: string;
  password: string;
};

export type AuthUserContract = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: Date | null;
};

export type AuthTokenPayloadContract = {
  token: string;
  user: AuthUserContract;
};

export type RegisterResponseContract = ApiSuccessResponse<AuthTokenPayloadContract>;
export type LoginResponseContract = ApiSuccessResponse<AuthTokenPayloadContract>;
export type MeResponseContract = ApiSuccessResponse<AuthUserContract>;
