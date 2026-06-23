import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { feedback } from "../../db/schema.js";

export type FeedbackRow = InferSelectModel<typeof feedback>;
export type NewFeedbackRow = InferInsertModel<typeof feedback>;

export class FeedbackRepository {
    async create(payload: NewFeedbackRow): Promise<FeedbackRow> {
        const result = await db.insert(feedback).values(payload).returning();
        return result[0]!;
    }
}

export const feedbackRepository = new FeedbackRepository();