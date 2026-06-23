import type { AppRole } from "../constants/roles";

export type JwtPayload = {
  userId: string;
  email: string;
  role: AppRole;
};
