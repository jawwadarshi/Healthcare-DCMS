import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import type { AppRole } from "../../common/constants/roles.js";

export type SafeUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
};

export type UsersListOptions = {
  page: number;
  limit: number;
  search?: string | undefined;
  role?: AppRole | undefined;
  sortBy: "name" | "email" | "role" | "createdAt";
  sortOrder: "asc" | "desc";
};

const safeUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
};

export class UsersRepository {
  async findById(id: string): Promise<SafeUserRow | null> {
    const result = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async list(options: UsersListOptions): Promise<{ items: SafeUserRow[]; total: number }> {
    const { page, limit, search, role, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;
    const whereConditions: SQL[] = [];

    if (search) {
      const term = `%${search}%`;
      const searchCondition = or(ilike(users.name, term), ilike(users.email, term));
      if (searchCondition) whereConditions.push(searchCondition);
    }

    if (role) {
      whereConditions.push(eq(users.role, role));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const orderColumnMap = {
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    };
    const orderColumn = orderColumnMap[sortBy] ?? users.createdAt;
    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const itemsQuery = db
      .select(safeUserColumns)
      .from(users)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}

export const usersRepository = new UsersRepository();
