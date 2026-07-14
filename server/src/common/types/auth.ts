import type { AppRole } from "../constants/roles.js";

export type JwtPayload = {
  userId: string;
  email: string;
  role: AppRole;
  doctorId?: string;
};
