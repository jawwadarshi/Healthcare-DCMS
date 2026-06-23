import { and, asc, desc, eq, sql, or, like } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { treatmentHistories, treatmentHistoryServices, services, patients } from "../../db/schema.js";

export type TreatmentHistoryRow = InferSelectModel<typeof treatmentHistories>;
export type NewTreatmentHistoryRow = InferInsertModel<typeof treatmentHistories>;
export type TreatmentHistoryServiceRow = InferSelectModel<typeof treatmentHistoryServices>;

export type TreatmentHistoryListOptions = {
    page: number;
    limit: number;
    sortBy: "treatmentDate" | "createdAt";
    sortOrder: "asc" | "desc";
};

export class TreatmentHistoryRepository {
    // Create a new treatment history record
    async create(payload: NewTreatmentHistoryRow): Promise<TreatmentHistoryRow> {
        const result = await db
            .insert(treatmentHistories)
            .values(payload)
            .returning();
        return result[0]!;
    }

    // Find treatment history by ID with associated services
    async findById(id: string): Promise<(TreatmentHistoryRow & { services: TreatmentHistoryServiceRow[] }) | null> {
        const history = await db
            .select()
            .from(treatmentHistories)
            .where(eq(treatmentHistories.id, id))
            .limit(1);

        if (!history[0]) {
            return null;
        }

        const historyServices = await db
            .select()
            .from(treatmentHistoryServices)
            .where(eq(treatmentHistoryServices.treatmentHistoryId, id));

        return {
            ...history[0],
            services: historyServices,
        };
    }

    // Find treatment history by appointment ID
    async findByAppointmentId(appointmentId: string): Promise<(TreatmentHistoryRow & { services: TreatmentHistoryServiceRow[] }) | null> {
        const history = await db
            .select()
            .from(treatmentHistories)
            .where(eq(treatmentHistories.appointmentId, appointmentId))
            .limit(1);

        if (!history[0]) {
            return null;
        }

        const historyServices = await db
            .select()
            .from(treatmentHistoryServices)
            .where(eq(treatmentHistoryServices.treatmentHistoryId, history[0].id));

        return {
            ...history[0],
            services: historyServices,
        };
    }

    // List treatment histories for a patient
    async listByPatientId(
        patientId: string,
        options: TreatmentHistoryListOptions
    ): Promise<{
        items: Array<TreatmentHistoryRow & { services: TreatmentHistoryServiceRow[] }>;
        total: number;
    }> {
        const { page, limit, sortBy, sortOrder } = options;
        const offset = (page - 1) * limit;

        const orderColumn = sortBy === "treatmentDate" ? treatmentHistories.treatmentDate : treatmentHistories.createdAt;
        const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

        // Get paginated histories
        const histories = await db
            .select()
            .from(treatmentHistories)
            .where(eq(treatmentHistories.patientId, patientId))
            .orderBy(orderDirection)
            .limit(limit)
            .offset(offset);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(treatmentHistories)
            .where(eq(treatmentHistories.patientId, patientId));

        // Fetch services for each history
        const itemsWithServices = await Promise.all(
            histories.map(async (history) => {
                const historyServices = await db
                    .select()
                    .from(treatmentHistoryServices)
                    .where(eq(treatmentHistoryServices.treatmentHistoryId, history.id));

                return {
                    ...history,
                    services: historyServices,
                };
            })
        );

        return {
            items: itemsWithServices,
            total: Number(countResult[0]?.count ?? 0),
        };
    }

    // Add services to treatment history
    async addServices(treatmentHistoryId: string, services: TreatmentHistoryServiceRow[]): Promise<void> {
        if (services.length > 0) {
            await db.insert(treatmentHistoryServices).values(
                services.map((s) => ({
                    ...s,
                    treatmentHistoryId,
                }))
            );
        }
    }

    // List distinct patients with their latest treatment info
    async listPatientsWithTreatments(
        options: { page: number; limit: number; search?: string }
    ): Promise<{
        items: Array<{
            patientId: string;
            firstName: string;
            lastName: string;
            phone: string;
            lastServiceName: string;
            lastTreatmentDate: string;
            lastNotes: string | null;
            totalTreatments: number;
        }>;
        total: number;
    }> {
        const { page, limit, search } = options;
        const offset = (page - 1) * limit;

        // Build search condition
        const searchCondition = search?.trim()
            ? or(
                like(patients.firstName, `%${search.trim()}%`),
                like(patients.lastName, `%${search.trim()}%`),
                like(patients.phone, `%${search.trim()}%`)
            )
            : undefined;

        // Get distinct patient IDs from treatment histories
        const historyRows = await db
            .select({
                patientId: treatmentHistories.patientId,
                count: sql<number>`count(*)`,
                lastDate: sql<string>`max(${treatmentHistories.treatmentDate})`,
            })
            .from(treatmentHistories)
            .groupBy(treatmentHistories.patientId)
            .orderBy(sql`max(${treatmentHistories.treatmentDate}) desc`)
            .limit(limit)
            .offset(offset);

        const totalResult = await db
            .select({ count: sql<number>`count(distinct ${treatmentHistories.patientId})` })
            .from(treatmentHistories);

        const total = Number(totalResult[0]?.count ?? 0);

        const items = await Promise.all(
            historyRows.map(async (row) => {
                const [patient] = await db
                    .select()
                    .from(patients)
                    .where(eq(patients.id, row.patientId))
                    .limit(1);

                if (!patient) return null;

                const [lastTreatment] = await db
                    .select()
                    .from(treatmentHistories)
                    .where(eq(treatmentHistories.patientId, row.patientId))
                    .orderBy(sql`${treatmentHistories.treatmentDate} desc`)
                    .limit(1);

                let lastServiceName = 'N/A';
                if (lastTreatment) {
                    const svc = await db
                        .select()
                        .from(treatmentHistoryServices)
                        .where(eq(treatmentHistoryServices.treatmentHistoryId, lastTreatment.id))
                        .limit(1);
                    if (svc[0]) lastServiceName = svc[0].serviceName;
                }

                return {
                    patientId: patient.id,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    phone: patient.phone,
                    lastServiceName,
                    lastTreatmentDate: row.lastDate,
                    lastNotes: lastTreatment?.notes || null,
                    totalTreatments: Number(row.count),
                };
            })
        );

        const filtered = items.filter(Boolean) as Array<{
            patientId: string;
            firstName: string;
            lastName: string;
            phone: string;
            lastServiceName: string;
            lastTreatmentDate: string;
            lastNotes: string | null;
            totalTreatments: number;
        }>;

        return { items: filtered, total };
    }

    // Update treatment history
    async updateById(
        id: string,
        patch: Partial<NewTreatmentHistoryRow>
    ): Promise<TreatmentHistoryRow | null> {
        const result = await db
            .update(treatmentHistories)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(treatmentHistories.id, id))
            .returning();

        return result[0] ?? null;
    }
}

export const treatmentHistoryRepository = new TreatmentHistoryRepository();
