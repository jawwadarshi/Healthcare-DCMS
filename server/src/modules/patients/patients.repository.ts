import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { patients } from "../../db/schema.js";

export type PatientRow = InferSelectModel<typeof patients>;
export type NewPatientRow = InferInsertModel<typeof patients>;

export type PatientsListOptions = {
  page: number;
  limit: number;
  search?: string;
  sortBy: "createdAt" | "firstName";
  sortOrder: "asc" | "desc";
};

export class PatientsRepository {
  async create(payload: NewPatientRow): Promise<PatientRow> {
    const result = await db.insert(patients).values(payload).returning();
    return result[0]!;
  }

  async findById(id: string): Promise<PatientRow | null> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0] ?? null;
  }

  async updateById(
    id: string,
    patch: Partial<NewPatientRow>
  ): Promise<PatientRow | null> {
    const result = await db
      .update(patients)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<PatientRow | null> {
    const result = await db.delete(patients).where(eq(patients.id, id)).returning();
    return result[0] ?? null;
  }

  async list(options: PatientsListOptions): Promise<{
    items: PatientRow[];
    total: number;
  }> {
    const { page, limit, search, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;

    let whereClause: SQL | undefined;

    if (search) {
      const term = `%${search}%`;
      whereClause = or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.phone, term)
      );
    }

    const orderColumn = sortBy === "firstName" ? patients.firstName : patients.createdAt;
    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const itemsQuery = db
      .select()
      .from(patients)
      .where(whereClause ? and(whereClause) : undefined)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(whereClause ? and(whereClause) : undefined);

    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}

export const patientsRepository = new PatientsRepository();
