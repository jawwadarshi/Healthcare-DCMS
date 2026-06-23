import { authenticate } from "../../common/middleware/rbac.middleware.js";

// Backward-compatible alias for existing auth routes/modules.
export const authMiddleware = authenticate;
