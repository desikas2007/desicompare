'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FoodCard } from '@/components/food/FoodCard';
import { categoryTagline } from '@/lib/imagery';
import type { SearchFoodItem } from '@/types';

interface FoodSectionProps {
  title: string;
  subtitle?: string;
  items: SearchFoodItem[];
  href?: string;
  showFavorites?: boolean;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (foodItemId: string) => void;
}

export function FoodSection({
  title,
  subtitle,
  items,
  href,
  showFavorites = false,
  favoriteIds,
  onToggleFavorite,
}: FoodSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{subtitle ?? categoryTagline(title)}</p>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition hover:gap-2"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
        {items.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            variant="rail"
            isFavorite={showFavorites ? favoriteIds?.has(item.id) ?? false : false}
            onToggleFavorite={showFavorites ? onToggleFavorite : undefined}
          />
        ))}
      </div>
    </section>
  );
}
