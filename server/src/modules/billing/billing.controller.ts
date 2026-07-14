/*import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { billingService } from "./billing.service.js";
import type { InvoiceRow, InvoiceItemRow } from "./billing.repository.js";

// Contract conversion helper
const toInvoiceContract = (invoice: InvoiceRow & { items: InvoiceItemRow[] }) => {
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        treatmentHistoryId: invoice.treatmentHistoryId,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus,
        paymentMethod: invoice.paymentMethod,
        paymentDate: invoice.paymentDate?.toISOString(),
        paymentNotes: invoice.paymentNotes,
        issuedDate: invoice.issuedDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        items: invoice.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
        })),
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
    };
};

export class BillingController {
    // Create invoice
    createInvoice = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);

        // Check authorization (Staff or Admin)
        if (!["staff", "admin"].includes(req.user.role)) {
            throw new AppError("Insufficient permissions", 403);
        }

        const result = await billingService.createInvoice(req.user.userId, req.body);
        return sendSuccessResponse(res, "Invoice created successfully", toInvoiceContract(result), 201);
    });

    // Get invoice by ID
    getInvoiceById = asyncHandler(async (req, res) => {
        const invoice = await billingService.getInvoiceById(req.params.id as string);
        return sendSuccessResponse(res, "Invoice fetched successfully", toInvoiceContract(invoice));
    });

    // List patient invoices
    listPatientInvoices = asyncHandler(async (req, res) => {
        const { items, total } = await billingService.listPatientInvoices(
            req.params.patientId as string,
            req.query as any
        );

        return sendSuccessResponse(res, "Invoices fetched successfully", {
            items: items.map(toInvoiceContract),
            meta: {
                page: (req.query as any).page,
                limit: (req.query as any).limit,
                total,
            },
        });
    });

    // Delete invoice (Admin only)
    deleteInvoice = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);
        if (req.user.role !== "admin") {
            throw new AppError("Only admins can delete invoices", 403);
        }
        const result = await billingService.deleteInvoice(req.params.id as string);
        if (!result) {
            throw new AppError("Invoice not found", 404);
        }
        return sendSuccessResponse(res, "Invoice deleted successfully", { id: result.id });
    });

    // Update payment status
    updatePaymentStatus = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);

        // Check authorization (Staff or Admin)
        if (!["staff", "admin"].includes(req.user.role)) {
            throw new AppError("Insufficient permissions", 403);
        }

        const result = await billingService.updatePaymentStatus(req.params.id as string, req.body);
        return sendSuccessResponse(res, "Payment status updated successfully", toInvoiceContract(result));
    });
}

export const billingController = new BillingController(); */
import { AppError } from "../../common/errors/app-error.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { billingService } from "./billing.service.js";
import type { InvoiceRow, InvoiceItemRow } from "./billing.repository.js";

// Contract conversion helper
const toInvoiceContract = (invoice: InvoiceRow & { items: InvoiceItemRow[] }) => {
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        treatmentHistoryId: invoice.treatmentHistoryId,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus,
        paymentMethod: invoice.paymentMethod,
        paymentDate: invoice.paymentDate?.toISOString(),
        paymentNotes: invoice.paymentNotes,
        issuedDate: invoice.issuedDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        items: invoice.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
        })),
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
    };
};

export class BillingController {
    // Create invoice
    createInvoice = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);

        if (!["staff", "admin"].includes(req.user.role)) {
            throw new AppError("Insufficient permissions", 403);
        }

        const result = await billingService.createInvoice(req.user.userId, req.body);

        // FIX: Ensure result is not null
        if (!result) throw new AppError("Failed to create invoice", 500);

        return sendSuccessResponse(res, "Invoice created successfully", toInvoiceContract(result), 201);
    });

    // Get invoice by ID
    getInvoiceById = asyncHandler(async (req, res) => {
        const invoice = await billingService.getInvoiceById(req.params.id as string);

        // FIX: Added guard clause to handle null
        if (!invoice) {
            throw new AppError("Invoice not found", 404);
        }

        return sendSuccessResponse(res, "Invoice fetched successfully", toInvoiceContract(invoice));
    });

    // List all invoices (global)
    listAllInvoices = asyncHandler(async (req, res) => {
        const { items, total } = await billingService.listAllInvoices(req.query as any);

        return sendSuccessResponse(res, "Invoices fetched successfully", {
            items: items.map(toInvoiceContract),
            meta: {
                page: Number((req.query as any).page) || 1,
                limit: Number((req.query as any).limit) || 10,
                total,
            },
        });
    });

    // List patient invoices
    listPatientInvoices = asyncHandler(async (req, res) => {
        const { items, total } = await billingService.listPatientInvoices(
            req.params.patientId as string,
            req.query as any
        );

        return sendSuccessResponse(res, "Invoices fetched successfully", {
            items: items.map(toInvoiceContract),
            meta: {
                page: Number((req.query as any).page) || 1,
                limit: Number((req.query as any).limit) || 10,
                total,
            },
        });
    });

    deleteInvoice = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);
        if (req.user.role !== "admin") {
            throw new AppError("Only admins can delete invoices", 403);
        }
        const result = await billingService.deleteInvoice(req.params.id as string);
        if (!result) {
            throw new AppError("Invoice not found", 404);
        }
        return sendSuccessResponse(res, "Invoice deleted successfully", { id: result.id });
    });

    // Update payment status
    updatePaymentStatus = asyncHandler(async (req, res) => {
        if (!req.user) throw new AppError("Unauthorized", 401);

        if (!["staff", "admin"].includes(req.user.role)) {
            throw new AppError("Insufficient permissions", 403);
        }

        const result = await billingService.updatePaymentStatus(
            req.params.id as string,
            req.body,
            req.user.userId
        );

        // FIX: Added guard clause to handle null
        if (!result) {
            throw new AppError("Invoice not found to update", 404);
        }

        return sendSuccessResponse(res, "Payment status updated successfully", toInvoiceContract(result));
    });
}

export const billingController = new BillingController();
