export enum AppRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  STAFF = "staff",
  PATIENT = "patient",
}

export const ALL_ROLES: AppRole[] = [
  AppRole.ADMIN,
  AppRole.DOCTOR,
  AppRole.STAFF,
  AppRole.PATIENT,
];

export const isAppRole = (value: string): value is AppRole => {
  return ALL_ROLES.includes(value as AppRole);
};
