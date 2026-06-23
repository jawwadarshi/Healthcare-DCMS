import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

export interface FeedbackFormValues {
    customerName: string;
    visitDate: string;
    rating: number;
    comments?: string;
}

export const useSubmitFeedback = () => {
    return useMutation({
        mutationFn: async (payload: FeedbackFormValues) => {
            const response = await apiClient.post('/feedback', payload);
            return response.data;
        },
    });
};