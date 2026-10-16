'use client';

import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { DietBadge } from '@/components/ui/Badge';
import { FoodImage } from '@/components/food/FoodImage';
import { categoryEmoji } from '@/lib/imagery';
import { formatCurrency } from '@/lib/format';
import { useAddToCart } from '@/hooks/useCart';
import type { FoodItemSummary, SearchFoodItem } from '@/types';

type Item = FoodItemSummary | SearchFoodItem;

interface FoodCardProps {
  item: Item;
  showCompare?: boolean;
  quantity?: number;
  variant?: 'grid' | 'rail';
  priority?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (foodItemId: string) => void;
  /** When set, the image and title open this page (e.g. a dish detail view). */
  detailHref?: string;
}

function hasMinPrice(item: Item): item is SearchFoodItem {
  return 'minPrice' in item;
}

export function FoodCard({
  item,
  showCompare = true,
  quantity = 1,
  variant = 'grid',
  priority = false,
  isFavorite = false,
  onToggleFavorite,
  detailHref,
}: FoodCardProps) {
  const addToCart = useAddToCart();
  const minPrice = hasMinPrice(item) ? item.minPrice : null;
  const providerCount = hasMinPrice(item) ? item.providerCount : 0;
  const compareHref = `/compare?q=${encodeURIComponent(item.displayName)}`;
  const primaryHref = detailHref ?? compareHref;

  return (
    <article
      className={[
        'group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm',
        'transition duration-200 hover:-translate-y-1 hover:shadow-md',
        variant === 'rail' ? 'w-[270px] shrink-0 snap-start sm:w-[300px]' : 'h-full',
      ].join(' ')}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        <Link href={primaryHref} aria-label={`View ${item.displayName}`} className="block h-full w-full">
          <FoodImage
            src={item.imageUrl}
            alt={item.displayName}
            category={item.category}
            seed={item.id}
            name={item.displayName}
            priority={priority}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <DietBadge dietaryType={item.dietaryType} />
        </div>

        {item.category ? (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-pill bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-xs backdrop-blur">
            <span aria-hidden>{categoryEmoji(item.category)}</span>
            {item.category}
          </span>
        ) : null}

        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(item.id)}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface/90 text-ink-soft shadow-sm backdrop-blur transition hover:text-primary"
          >
            <Heart
              className="h-4 w-4"
              fill={isFavorite ? 'currentColor' : 'none'}
              color={isFavorite ? 'var(--color-primary)' : 'currentColor'}
            />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {item.portionSize || 'Standard portion'}
        </p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
          <Link href={primaryHref} className="transition hover:text-primary">
            {item.displayName}
          </Link>
        </h3>
        {item.description ? (
          <p className="line-clamp-2 text-sm text-ink-soft">{item.description}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/70 pt-3">
          {minPrice != null ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                from · {providerCount} platform{providerCount === 1 ? '' : 's'}
              </p>
              <p className="text-xl font-bold text-ink">{formatCurrency(minPrice)}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Price varies by provider</p>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {showCompare ? (
            <Link
              href={compareHref}
              className="inline-flex flex-1 items-center justify-center rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Compare prices
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => addToCart.mutate({ foodItemId: item.id, quantity })}
            disabled={addToCart.isPending}
            aria-label={`Add ${item.displayName} to cart`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line bg-surface text-ink transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
