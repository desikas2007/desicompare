import { api } from '@/lib/api-client';
import type { Paginated, RestaurantDetail, RestaurantSummary } from '@/types';

export interface RestaurantFilters {
  q?: string;
  cuisine?: string;
  page?: number;
  limit?: number;
}

export const restaurantService = {
  async list(filters: RestaurantFilters = {}): Promise<Paginated<RestaurantSummary>> {
    const { data, meta } = await api.getWithMeta<RestaurantSummary[]>('/restaurants', {
      auth: false,
      query: {
        q: filters.q,
        cuisine: filters.cuisine,
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

  get(id: string): Promise<RestaurantDetail> {
    return api.get<RestaurantDetail>(`/restaurants/${id}`, { auth: false });
  },
};
