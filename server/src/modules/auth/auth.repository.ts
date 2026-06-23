import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  }

  async createUser(payload: NewUser): Promise<User> {
    const result = await db.insert(users).values(payload).returning();
    return result[0]!;
  }
}
