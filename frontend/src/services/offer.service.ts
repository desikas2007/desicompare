import { api } from '@/lib/api-client';
import type { OfferSummary, Paginated } from '@/types';

export interface OfferFilters {
  providerId?: string;
  restaurantId?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export const offerService = {
  async list(filters: OfferFilters = {}): Promise<Paginated<OfferSummary>> {
    const { data, meta } = await api.getWithMeta<OfferSummary[]>('/offers', {
      auth: false,
      query: {
        providerId: filters.providerId,
        restaurantId: filters.restaurantId,
        activeOnly: filters.activeOnly ? 'true' : undefined,
        page: filters.page ?? 1,
        limit: filters.limit ?? 12,
      },
    });
    return {
      items: data,
      meta: {
        page: meta?.page ?? filters.page ?? 1,
        limit: meta?.limit ?? filters.limit ?? 12,
        total: meta?.total ?? data.length,
        totalPages: meta?.totalPages ?? 1,
      },
    };
  },

  get(id: string): Promise<OfferSummary> {
    return api.get<OfferSummary>(`/offers/${id}`, { auth: false });
  },
};
