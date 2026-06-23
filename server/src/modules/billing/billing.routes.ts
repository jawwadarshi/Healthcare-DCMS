import { Router } from "express";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { authenticate } from "../../common/middleware/rbac.middleware.js";
import { billingController } from "./billing.controller.js";
import {
    createInvoiceSchema,
    updatePaymentStatusSchema,
    getInvoiceSchema,
    getPatientInvoicesSchema,
    listAllInvoicesSchema,
} from "./billing.validation.js";
import { BILLING_ENDPOINTS } from "../../contracts/api-routes.contract.js";

export const billingRoutes = Router();

// Middleware
billingRoutes.use(authenticate);

// POST /billing/invoices - Create invoice (Staff/Admin)
billingRoutes.post(
    BILLING_ENDPOINTS.createInvoice,
    validateRequest(createInvoiceSchema),
    billingController.createInvoice
);

// GET /billing/invoices/:id - Get invoice by ID
billingRoutes.get(
    BILLING_ENDPOINTS.invoiceById,
    validateRequest(getInvoiceSchema),
    billingController.getInvoiceById
);

// GET /billing/invoices - List all invoices (global)
billingRoutes.get(
    BILLING_ENDPOINTS.invoices,
    validateRequest(listAllInvoicesSchema),
    billingController.listAllInvoices
);

// GET /billing/invoices/patient/:patientId - List patient invoices
billingRoutes.get(
    BILLING_ENDPOINTS.getPatientInvoices,
    validateRequest(getPatientInvoicesSchema),
    billingController.listPatientInvoices
);

// PATCH /billing/invoices/:id/payment-status - Update payment status (Staff/Admin)
billingRoutes.patch(
    BILLING_ENDPOINTS.updatePaymentStatus,
    validateRequest(updatePaymentStatusSchema),
    billingController.updatePaymentStatus
);

// DELETE /billing/invoices/:id - Delete invoice (Admin only)
billingRoutes.delete(
    BILLING_ENDPOINTS.invoiceById,
    validateRequest(getInvoiceSchema),
    billingController.deleteInvoice
);
