import { api } from '@/lib/api-client';
import type { SearchFilters, SearchResult } from '@/types';

export const searchService = {
  search(filters: SearchFilters): Promise<SearchResult> {
    return api.get<SearchResult>('/search', {
      auth: false,
      query: {
        q: filters.q,
        category: filters.category,
        cuisine: filters.cuisine,
        provider: filters.provider,
        dietaryType: filters.dietaryType,
        mealType: filters.mealType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        maxDeliveryMinutes: filters.maxDeliveryMinutes,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      },
    });
  },
};
