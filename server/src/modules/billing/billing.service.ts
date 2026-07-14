import { AppError } from "../../common/errors/app-error.js";
import { db } from "../../db/index.js";
import { patients, services, payments, invoices } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { billingRepository, type InvoiceItemRow } from "./billing.repository.js";
import type { CreateInvoiceInput, UpdatePaymentStatusInput, GetPatientInvoicesQuery, ListAllInvoicesQuery } from "./billing.validation.js";
import { inArray } from 'drizzle-orm';

export class BillingService {
    /**
     * Generate a unique invoice number
     */
    private generateInvoiceNumber(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");

        return `INV-${year}${month}${day}-${random}`;
    }

    /**
     * Create a new invoice with items
     */
    async createInvoice(createdBy: string, payload: CreateInvoiceInput) {
        // Validate patient exists
        const patient = await db
            .select()
            .from(patients)
            .where(eq(patients.id, payload.patientId))
            .limit(1);

        if (!patient[0]) {
            throw new AppError("Patient not found", 404);
        }

        // Validate all services exist
        const serviceIds = payload.items.map((item) => item.serviceId);
        const result = await db.select()
            .from(services)
            .where(inArray(services.id, serviceIds));

        if (serviceIds.length !== serviceIds.length) {
            throw new AppError("One or more services not found", 404);
        }

        // Calculate totals
        let subtotal = 0;
        const invoiceItems: Omit<InvoiceItemRow, "id" | "invoiceId" | "createdAt">[] = [];

        for (const item of payload.items) {
            const unitPrice = parseFloat(item.unitPrice);
            const itemSubtotal = unitPrice * item.quantity;
            subtotal += itemSubtotal;

            invoiceItems.push({
                serviceId: item.serviceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: unitPrice.toString(),
                subtotal: itemSubtotal.toString(),
            });
        }

        // Calculate discount: flat amount OR percentage (1-20%)
        let discountAmount = parseFloat(payload.discount || "0");
        if (payload.discountPercent && payload.discountPercent >= 1 && payload.discountPercent <= 20) {
            const percentDiscount = subtotal * (payload.discountPercent / 100);
            // Use the larger of flat discount and percent discount
            discountAmount = Math.max(discountAmount, percentDiscount);
        }

        const total = Math.max(0, subtotal - discountAmount);

        // Create invoice
        const invoice = await billingRepository.createInvoice({
            invoiceNumber: this.generateInvoiceNumber(),
            patientId: payload.patientId,
            treatmentHistoryId: payload.treatmentHistoryId,
            subtotal: subtotal.toString(),
            discount: discountAmount.toString(),
            total: total.toString(),
            paymentStatus: "pending",
            paymentMethod: undefined,
            paymentDate: undefined,
            paymentNotes: undefined,
            issuedDate: new Date(),
            dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
            createdBy,
        });

        // Add items to invoice
        await billingRepository.addInvoiceItems(invoice.id, invoiceItems);

        // Fetch and return invoice with items
        return await billingRepository.findInvoiceById(invoice.id);
    }

    /**
     * Get invoice by ID
     */
    async getInvoiceById(id: string) {
        const invoice = await billingRepository.findInvoiceById(id);
        if (!invoice) {
            throw new AppError("Invoice not found", 404);
        }
        return invoice;
    }

    /**
     * List all invoices (global)
     */
    async deleteInvoice(id: string) {
        const invoice = await billingRepository.findInvoiceById(id);
        if (!invoice) {
            throw new AppError("Invoice not found", 404);
        }
        return await billingRepository.deleteInvoice(id);
    }

    async listAllInvoices(query: ListAllInvoicesQuery) {
        return await billingRepository.listAllInvoices({
            page: query.page,
            limit: query.limit,
            paymentStatus: query.paymentStatus,
            search: query.search,
        });
    }

    /**
     * List patient invoices
     */
    async listPatientInvoices(patientId: string, query: GetPatientInvoicesQuery) {
        // Validate patient exists
        const patient = await db
            .select()
            .from(patients)
            .where(eq(patients.id, patientId))
            .limit(1);

        if (!patient[0]) {
            throw new AppError("Patient not found", 404);
        }

        return await billingRepository.listPatientInvoices(patientId, {
            page: query.page,
            limit: query.limit,
            paymentStatus: query.paymentStatus,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
    }

    /**
     * Get the sum of all payments for a given invoice.
     */
    private async getTotalPaidForInvoice(invoiceId: string): Promise<number> {
        const result = await db
            .select({ totalPaid: sql<number>`COALESCE(SUM(CAST(amount AS numeric)), 0)` })
            .from(payments)
            .where(eq(payments.invoiceId, invoiceId));

        return Number(result[0]?.totalPaid ?? 0);
    }

    /**
     * Calculate the effective total for an invoice after optional discount percent.
     */
    private calculateDiscountedTotal(
        invoiceTotal: number,
        discountPercent?: number
    ): number {
        if (discountPercent && discountPercent >= 1 && discountPercent <= 20) {
            return Math.max(0, invoiceTotal * (1 - discountPercent / 100));
        }
        return invoiceTotal;
    }

    /**
     * Update invoice payment status with split ledger tracking.
     * Inserts a payment row and recalculates the payment status based on remaining balance.
     * Supports optional `amount` for partial payments and optional `discountPercent` to reduce total.
     */
    async updatePaymentStatus(id: string, payload: UpdatePaymentStatusInput, userId?: string) {
        // Validate invoice exists
        const invoice = await billingRepository.findInvoiceById(id);
        if (!invoice) {
            throw new AppError("Invoice not found", 404);
        }

        // Validate payment status
        const validStatuses = ["pending", "paid", "partially_paid"];
        if (!validStatuses.includes(payload.paymentStatus)) {
            throw new AppError("Invalid payment status", 400);
        }

        // Calculate effective total after optional discount percent
        const invoiceTotal = parseFloat(invoice.total);
        const effectiveTotal = this.calculateDiscountedTotal(invoiceTotal, payload.discountPercent);

        // If a discount percent was applied and it changes the total, update the invoice's total
        if (payload.discountPercent && payload.discountPercent >= 1 && payload.discountPercent <= 20) {
            const discountAmount = invoiceTotal - effectiveTotal;
            await db
                .update(invoices)
                .set({
                    discount: discountAmount.toString(),
                    total: effectiveTotal.toString(),
                    updatedAt: new Date(),
                })
                .where(eq(invoices.id, id));
        }

        // Get previous payments total
        const previousPaid = await this.getTotalPaidForInvoice(invoice.id);

        // Determine the amount to insert
        let amountToInsert: number;
        if (payload.amount) {
            amountToInsert = parseFloat(payload.amount);
        } else {
            // Default: pay the full remaining balance
            amountToInsert = Math.max(0, effectiveTotal - previousPaid);
        }

        // Insert a payment record (split ledger)
        if (amountToInsert > 0) {
            const effectiveUserId = userId ?? invoice.createdBy;
            await db.insert(payments).values({
                invoiceId: invoice.id,
                amount: amountToInsert.toString(),
                paymentMethod: payload.paymentMethod ?? null,
                paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
                notes: payload.paymentNotes ?? null,
                createdBy: effectiveUserId,
            });
        }

        // Calculate new total paid and determine status
        const newTotalPaid = previousPaid + Math.max(0, amountToInsert);
        const remaining = Math.max(0, effectiveTotal - newTotalPaid);

        let finalStatus: string;
        if (remaining <= 0) {
            finalStatus = "paid";
        } else if (newTotalPaid > 0) {
            finalStatus = "partially_paid";
        } else {
            finalStatus = "pending";
        }

        // Update payment status
        const updated = await billingRepository.updatePaymentStatus(
            id,
            finalStatus,
            payload.paymentMethod,
            payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
            payload.paymentNotes
        );

        if (!updated) {
            throw new AppError("Failed to update invoice", 500);
        }

        // Log payment update
        console.info(`[Billing] Invoice ${invoice.invoiceNumber} payment status updated to ${finalStatus} (paid: ${newTotalPaid}, remaining: ${remaining})`);

        // Fetch and return updated invoice
        return await billingRepository.findInvoiceById(id);
    }
}

export const billingService = new BillingService();