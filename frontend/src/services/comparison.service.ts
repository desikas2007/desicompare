import { api } from '@/lib/api-client';
import type { ComparisonResult, Paginated } from '@/types';

export interface CreateComparisonInput {
  query: string;
  location?: string;
  quantity?: number;
  providers?: string[];
}

export const comparisonService = {
  create(input: CreateComparisonInput): Promise<ComparisonResult> {
    return api.post<ComparisonResult>('/comparisons', input);
  },

  get(id: string): Promise<ComparisonResult> {
    return api.get<ComparisonResult>(`/comparisons/${id}`);
  },

  async history(page = 1, limit = 10): Promise<Paginated<ComparisonResult>> {
    const { data, meta } = await api.getWithMeta<ComparisonResult[]>('/comparisons/history', {
      query: { page, limit },
    });
    return {
      items: data,
      meta: {
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
        total: meta?.total ?? data.length,
        totalPages: meta?.totalPages ?? 1,
      },
    };
  },
};
