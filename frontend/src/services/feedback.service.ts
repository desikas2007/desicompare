import { api } from '@/lib/api-client';
import type { FeedbackCategory, FeedbackSummary } from '@/types';

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  rating?: number;
  message: string;
  restaurantId?: string;
  foodItemId?: string;
}

export const feedbackService = {
  create(input: CreateFeedbackInput): Promise<FeedbackSummary> {
    return api.post<FeedbackSummary>('/feedback', input);
  },

  listMine(): Promise<FeedbackSummary[]> {
    return api.get<FeedbackSummary[]>('/feedback/mine');
  },
};
