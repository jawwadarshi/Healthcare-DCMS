import { feedbackRepository } from "./feedback.repository.js";
import type { CreateFeedbackInput } from "./feedback.validation.js";
import type { InferInsertModel } from "drizzle-orm";
import { feedback } from "../../db/schema.js";

type NewFeedback = InferInsertModel<typeof feedback>;

export class FeedbackService {
    async createFeedback(payload: CreateFeedbackInput): Promise<NewFeedback> {
        return await feedbackRepository.create({
            customerName: payload.customerName,
            visitDate: payload.visitDate,
            rating: payload.rating,
            comments: payload.comments || null,
        });
    }
}

export const feedbackService = new FeedbackService();