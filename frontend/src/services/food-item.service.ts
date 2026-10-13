import { api } from '@/lib/api-client';
import type { DietaryType, FoodItemSummary, MealType, Paginated } from '@/types';

export interface FoodItemFilters {
  q?: string;
  category?: string;
  dietaryType?: DietaryType;
  mealType?: MealType;
  restaurantId?: string;
  page?: number;
  limit?: number;
}

export interface FoodItemDetail extends FoodItemSummary {
  restaurant: { id: string; displayName: string; cuisine: string[] } | null;
}

export interface FoodCategoryCount {
  name: string;
  count: number;
}

export const foodItemService = {
  async list(filters: FoodItemFilters = {}): Promise<Paginated<FoodItemSummary>> {
    const { data, meta } = await api.getWithMeta<FoodItemSummary[]>('/food-items', {
      auth: false,
      query: {
        q: filters.q,
        category: filters.category,
        dietaryType: filters.dietaryType,
        mealType: filters.mealType,
        restaurantId: filters.restaurantId,
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

  categories(): Promise<FoodCategoryCount[]> {
    return api.get<FoodCategoryCount[]>('/food-items/categories', { auth: false });
  },

  get(id: string): Promise<FoodItemDetail> {
    return api.get<FoodItemDetail>(`/food-items/${id}`, { auth: false });
  },
};
