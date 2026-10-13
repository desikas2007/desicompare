'use client';

import { FoodCard } from '@/components/food/FoodCard';
import type { FoodItemSummary, SearchFoodItem } from '@/types';

type Item = FoodItemSummary | SearchFoodItem;

interface FoodGridProps {
  items: Item[];
  priorityCount?: number;
  showFavorites?: boolean;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (foodItemId: string) => void;
  emptyMessage?: string;
  /** Prefix for per-item detail links, e.g. `/dishes` → `/dishes/<id>`. */
  detailHrefBase?: string;
}

export function FoodGrid({
  items,
  priorityCount = 0,
  showFavorites = false,
  favoriteIds,
  onToggleFavorite,
  emptyMessage = 'No dishes matched your search yet.',
  detailHrefBase,
}: FoodGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-12 text-center text-sm text-ink-soft">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <FoodCard
          key={item.id}
          item={item}
          priority={index < priorityCount}
          isFavorite={showFavorites ? favoriteIds?.has(item.id) ?? false : false}
          onToggleFavorite={showFavorites ? onToggleFavorite : undefined}
          detailHref={detailHrefBase ? `${detailHrefBase}/${item.id}` : undefined}
        />
      ))}
    </div>
  );
}
