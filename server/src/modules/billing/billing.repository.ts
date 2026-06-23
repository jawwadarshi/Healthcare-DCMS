import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { invoices, invoiceItems, services } from "../../db/schema.js";

export type InvoiceRow = InferSelectModel<typeof invoices>;
export type NewInvoiceRow = InferInsertModel<typeof invoices>;
export type InvoiceItemRow = InferSelectModel<typeof invoiceItems>;

export type InvoicesListOptions = {
    page: number;
    limit: number;
    paymentStatus?: string;
    sortBy: "issuedDate" | "total";
    sortOrder: "asc" | "desc";
};

export type AllInvoicesListOptions = {
    page: number;
    limit: number;
    paymentStatus?: string;
    search?: string;
};

export class BillingRepository {
    // Create a new invoice
    async createInvoice(payload: NewInvoiceRow): Promise<InvoiceRow> {
        const result = await db.insert(invoices).values(payload).returning();
        return result[0]!;
    }

    // Add items to invoice
    async addInvoiceItems(invoiceId: string, items: Omit<InvoiceItemRow, "id" | "invoiceId" | "createdAt">[]): Promise<void> {
        if (items.length > 0) {
            await db.insert(invoiceItems).values(
                items.map((item) => ({
                    ...item,
                    invoiceId,
                }))
            );
        }
    }

    // Find invoice by ID with items
    async findInvoiceById(id: string): Promise<(InvoiceRow & { items: InvoiceItemRow[] }) | null> {
        const invoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (!invoice[0]) {
            return null;
        }

        const items = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, id));

        return {
            ...invoice[0],
            items,
        };
    }

    // List all invoices (no patient filter) with search and pending-first sorting
    async listAllInvoices(
        options: AllInvoicesListOptions
    ): Promise<{
        items: Array<InvoiceRow & { items: InvoiceItemRow[] }>;
        total: number;
    }> {
        const { page, limit, paymentStatus, search } = options;
        const offset = (page - 1) * limit;

        const whereConditions: SQL[] = [];
        if (paymentStatus) {
            whereConditions.push(eq(invoices.paymentStatus, paymentStatus));
        }
        if (search?.trim()) {
            // search by invoice number (case-insensitive LIKE)
            whereConditions.push(sql`LOWER(${invoices.invoiceNumber}) LIKE LOWER(${'%' + search.trim() + '%'})`);
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Smart sorting: pending/partially_paid first (by issuedDate desc), then paid (by issuedDate desc)
        const orderExpr = sql`CASE 
            WHEN ${invoices.paymentStatus} = 'pending' THEN 0 
            WHEN ${invoices.paymentStatus} = 'partially_paid' THEN 1 
            ELSE 2 
        END, ${invoices.issuedDate} DESC`;

        const invoiceList = await db
            .select()
            .from(invoices)
            .where(whereClause)
            .orderBy(orderExpr)
            .limit(limit)
            .offset(offset);

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(whereClause);

        const itemsWithServices = await Promise.all(
            invoiceList.map(async (invoice) => {
                const items = await db
                    .select()
                    .from(invoiceItems)
                    .where(eq(invoiceItems.invoiceId, invoice.id));

                return {
                    ...invoice,
                    items,
                };
            })
        );

        return {
            items: itemsWithServices,
            total: Number(countResult[0]?.count ?? 0),
        };
    }

    // Find invoice by invoice number
    async findInvoiceByNumber(invoiceNumber: string): Promise<InvoiceRow | null> {
        const result = await db
            .select()
            .from(invoices)
            .where(eq(invoices.invoiceNumber, invoiceNumber))
            .limit(1);

        return result[0] ?? null;
    }

    // List invoices for a patient
    async listPatientInvoices(
        patientId: string,
        options: InvoicesListOptions
    ): Promise<{
        items: Array<InvoiceRow & { items: InvoiceItemRow[] }>;
        total: number;
    }> {
        const { page, limit, paymentStatus, sortBy, sortOrder } = options;
        const offset = (page - 1) * limit;

        const whereConditions: SQL[] = [eq(invoices.patientId, patientId)];
        if (paymentStatus) {
            whereConditions.push(eq(invoices.paymentStatus, paymentStatus));
        }

        const whereClause = and(...whereConditions);
        const orderColumn = sortBy === "issuedDate" ? invoices.issuedDate : invoices.total;
        const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

        // Get paginated invoices
        const invoiceList = await db
            .select()
            .from(invoices)
            .where(whereClause)
            .orderBy(orderDirection)
            .limit(limit)
            .offset(offset);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(whereClause);

        // Fetch items for each invoice
        const itemsWithServices = await Promise.all(
            invoiceList.map(async (invoice) => {
                const items = await db
                    .select()
                    .from(invoiceItems)
                    .where(eq(invoiceItems.invoiceId, invoice.id));

                return {
                    ...invoice,
                    items,
                };
            })
        );

        return {
            items: itemsWithServices,
            total: Number(countResult[0]?.count ?? 0),
        };
    }

    // Update invoice payment status
    async updatePaymentStatus(
        id: string,
        paymentStatus: string,
        paymentMethod?: string,
        paymentDate?: Date,
        paymentNotes?: string
    ): Promise<InvoiceRow | null> {
        const result = await db
            .update(invoices)
            .set({
                paymentStatus,
                paymentMethod: paymentMethod ?? undefined,
                paymentDate: paymentDate ?? undefined,
                paymentNotes: paymentNotes ?? undefined,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, id))
            .returning();

        return result[0] ?? null;
    }

    // Delete invoice (and cascade delete items)
    async deleteInvoice(id: string): Promise<InvoiceRow | null> {
        const result = await db
            .delete(invoices)
            .where(eq(invoices.id, id))
            .returning();

        return result[0] ?? null;
    }
}

export const billingRepository = new BillingRepository();
