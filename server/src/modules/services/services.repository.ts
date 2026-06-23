/*import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { services } from "../../db/schema.js";

export type ServiceRow = InferSelectModel<typeof services>;
export type NewServiceRow = InferInsertModel<typeof services>;

export type ServicesListOptions = {
  page: number;
  limit: number;
  search?: string | undefined;
  sortBy: "name" | "basePrice" | "createdAt";
  sortOrder: "asc" | "desc";
};

export class ServicesRepository {
  async create(payload: NewServiceRow): Promise<ServiceRow> {
    const result = await db.insert(services).values(payload).returning();
    return result[0]!;
  }

  async findById(id: string): Promise<ServiceRow | null> {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0] ?? null;
  }

  async updateById(
    id: string,
    patch: Partial<NewServiceRow>
  ): Promise<ServiceRow | null> {
    const result = await db
      .update(services)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<ServiceRow | null> {
    const result = await db.delete(services).where(eq(services.id, id)).returning();
    return result[0] ?? null;
  }

  async list(options: ServicesListOptions): Promise<{
    items: ServiceRow[];
    total: number;
  }> {
    const { page, limit, search, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;

    let whereClause: SQL | undefined;

    if (search) {
      const term = `%${search}%`;
      whereClause = or(
        ilike(services.name, term),
        ilike(services.description, term)
      );
    }

    const orderColumnMap = {
      name: services.name,
      basePrice: services.basePrice,
      createdAt: services.createdAt,
    };

    const orderColumn = orderColumnMap[sortBy];
    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const itemsQuery = db
      .select()
      .from(services)
      .where(whereClause ? and(whereClause) : undefined)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(whereClause ? and(whereClause) : undefined);

    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}

export const servicesRepository = new ServicesRepository();
*/

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { services } from "../../db/schema.js";

export type ServiceRow = InferSelectModel<typeof services>;
export type NewServiceRow = InferInsertModel<typeof services>;

export type ServicesListOptions = {
  page: number;
  limit: number;
  search?: string | undefined;
  isActive?: "true" | "false" | undefined;
  sortBy?: "name" | "basePrice" | "createdAt"; // Made optional
  sortOrder?: "asc" | "desc"; // Made optional
};

export class ServicesRepository {
  async create(payload: NewServiceRow): Promise<ServiceRow> {
    const result = await db.insert(services).values(payload).returning();
    return result[0]!;
  }

  async findById(id: string): Promise<ServiceRow | null> {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0] ?? null;
  }

  async updateById(
    id: string,
    patch: Partial<NewServiceRow>
  ): Promise<ServiceRow | null> {
    const result = await db
      .update(services)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<ServiceRow | null> {
    const result = await db.delete(services).where(eq(services.id, id)).returning();
    return result[0] ?? null;
  }

  async list(options: ServicesListOptions): Promise<{
    items: ServiceRow[];
    total: number;
  }> {
    const { page, limit, search, isActive, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;

    const whereConditions: SQL[] = [];

    if (search) {
      const term = `%${search}%`;
      const searchCondition = or(
        ilike(services.name, term),
        ilike(services.description, term)
      );
      if (searchCondition) whereConditions.push(searchCondition);
    }

    if (isActive) {
      whereConditions.push(eq(services.isActive, isActive === "true"));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // 1. Define the Map
    const orderColumnMap = {
      name: services.name,
      basePrice: services.basePrice,
      createdAt: services.createdAt,
    };

    // 2. Resolve the column with a fallback to avoid "ORDER BY desc" error
    // If sortBy is missing or invalid, default to services.createdAt
    const orderColumn = (sortBy && orderColumnMap[sortBy]) ? orderColumnMap[sortBy] : services.createdAt;

    // 3. Apply Direction
    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const itemsQuery = db
      .select()
      .from(services)
      .where(whereClause) // Drizzle handles 'undefined' in .where() automatically
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(whereClause);

    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}

export const servicesRepository = new ServicesRepository();
