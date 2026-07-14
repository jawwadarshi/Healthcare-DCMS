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

        // 🛠️ Safe parsing: handle Date objects, strings, or null values without crashing
        paymentDate: invoice.paymentDate
            ? (invoice.paymentDate instanceof Date
                ? invoice.paymentDate.toISOString()
                : new Date(invoice.paymentDate).toISOString())
            : null,

        paymentNotes: invoice.paymentNotes,
        issuedDate: invoice.issuedDate instanceof Date ? invoice.issuedDate.toISOString() : new Date(invoice.issuedDate).toISOString(),
        dueDate: invoice.dueDate
            ? (invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : new Date(invoice.dueDate).toISOString())
            : null,

        items: invoice.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
        })),
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : new Date(invoice.createdAt).toISOString(),
        updatedAt: invoice.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : new Date(invoice.updatedAt).toISOString(),
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

        console.log(`[Billing] updatePaymentStatus called for invoice ${req.params.id}`, JSON.stringify(req.body));

        try {
            const result = await billingService.updatePaymentStatus(
                req.params.id as string,
                req.body,
                req.user.userId
            );

            if (!result) {
                throw new AppError("Invoice not found to update", 404);
            }

            console.log(`[Billing] Payment status updated successfully for invoice ${req.params.id}`);
            return sendSuccessResponse(res, "Payment status updated successfully", toInvoiceContract(result));
        } catch (error) {
            console.error(`[Billing] Error updating payment status for invoice ${req.params.id}:`, error);
            // Re-throw AppError instances as-is, wrap others in 500
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                `Failed to update payment status: ${error instanceof Error ? error.message : "Unknown error"}`,
                500
            );
        }
    });
}

export const billingController = new BillingController();