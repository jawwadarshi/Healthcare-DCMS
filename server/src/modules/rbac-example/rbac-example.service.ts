type AccessMessage = {
  access: string;
  roleScope: string;
};

export class RbacExampleService {
  adminOnly(): AccessMessage {
    return {
      access: "granted",
      roleScope: "admin",
    };
  }

  doctorOnly(): AccessMessage {
    return {
      access: "granted",
      roleScope: "doctor",
    };
  }

  staffOnly(): AccessMessage {
    return {
      access: "granted",
      roleScope: "staff",
    };
  }

  adminDoctorShared(): AccessMessage {
    return {
      access: "granted",
      roleScope: "admin|doctor",
    };
  }
}

export const rbacExampleService = new RbacExampleService();
