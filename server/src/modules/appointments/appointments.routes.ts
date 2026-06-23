import { Router } from "express";
import { AppRole } from "../../common/constants/roles.js";
import { authenticate, authorizeRoles } from "../../common/middleware/rbac.middleware.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { APPOINTMENTS_ENDPOINTS } from "../../contracts/api-routes.contract.js";
import { appointmentsController } from "./appointments.controller.js";
import {
  createAppointmentSchema,
  deleteAppointmentSchema,
  getAppointmentByIdSchema,
  listAppointmentsSchema,
  publicBookingSchema,
  updateAppointmentSchema,
} from "./appointments.validation.js";

const router = Router();

/**
 * RBAC ACCESS LEVELS
 */
const staffAccessRoles = [AppRole.ADMIN, AppRole.STAFF];
const readOnlyRoles = [AppRole.ADMIN, AppRole.STAFF, AppRole.DOCTOR];

// 1. PUBLIC BOOKING (No Token Needed)
// Path: POST /api/v1/appointments/book
router.post(
  APPOINTMENTS_ENDPOINTS.publicBooking,
  validateRequest(publicBookingSchema),
  appointmentsController.publicBooking
);

// --- ALL ROUTES BELOW REQUIRE AUTHENTICATION ---

// 2. CREATE INTERNAL APPOINTMENT
// Path: POST /api/v1/appointments
router.post(APPOINTMENTS_ENDPOINTS.root, authenticate, // Verifies JWT and sets req.user
  authorizeRoles(...staffAccessRoles), // Checks if role is admin or staff
  validateRequest(createAppointmentSchema),
  appointmentsController.create
);

// 3. LIST APPOINTMENTS
// Path: GET /api/v1/appointments
router.get(
  APPOINTMENTS_ENDPOINTS.root,
  authenticate,
  authorizeRoles(...readOnlyRoles),
  validateRequest(listAppointmentsSchema),
  appointmentsController.list
);

// 4. GET SINGLE APPOINTMENT
// Path: GET /api/v1/appointments/:id
router.get(
  APPOINTMENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...readOnlyRoles),
  validateRequest(getAppointmentByIdSchema),
  appointmentsController.getById
);

// 5. UPDATE APPOINTMENT
// Path: PATCH /api/v1/appointments/:id
router.patch(
  APPOINTMENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(...staffAccessRoles),
  validateRequest(updateAppointmentSchema),
  appointmentsController.update
);

// 6. DELETE APPOINTMENT (Admin Only)
// Path: DELETE /api/v1/appointments/:id
router.delete(
  APPOINTMENTS_ENDPOINTS.byId,
  authenticate,
  authorizeRoles(AppRole.ADMIN),
  validateRequest(deleteAppointmentSchema),
  appointmentsController.delete
);

export const appointmentsRoutes = router;