'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiError } from '@/lib/api-client';
import type { FavoriteSummary } from '@/types';

const FAVORITES_KEY = ['favorites'] as const;

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => userService.listFavorites(),
    staleTime: 60_000,
  });
}

/** Set of favourited food item ids, for quick card lookups. */
export function useFavoriteFoodIds(): Set<string> {
  const { data } = useFavorites();
  return useMemo(() => {
    const ids = new Set<string>();
    for (const favorite of data ?? []) {
      if (favorite.foodItemId) ids.add(favorite.foodItemId);
    }
    return ids;
  }, [data]);
}

function favoriteIdForFood(list: FavoriteSummary[] | undefined, foodItemId: string): string | undefined {
  return list?.find((favorite) => favorite.foodItemId === foodItemId)?.id;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const favorites = useFavorites();

  return useMutation({
    mutationFn: async (foodItemId: string) => {
      const existingId = favoriteIdForFood(favorites.data, foodItemId);
      if (existingId) {
        await userService.removeFavorite(existingId);
        return 'removed' as const;
      }
      await userService.addFavorite({ foodItemId });
      return 'added' as const;
    },
    onSuccess: (action) => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
      toast.notify(action === 'added' ? 'Saved to your wishlist' : 'Removed from wishlist');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Could not update wishlist';
      toast.error(message);
    },
  });
}
