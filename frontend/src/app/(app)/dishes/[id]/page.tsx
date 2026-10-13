'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { foodItemService } from '@/services/food-item.service';
import { FoodImage } from '@/components/food/FoodImage';
import { FoodGrid } from '@/components/food/FoodGrid';
import { DietBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAddToCart } from '@/hooks/useCart';
import { useFavoriteFoodIds, useToggleFavorite } from '@/hooks/useFavorites';
import { formatCurrency } from '@/lib/format';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export default function DishDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const dish = useQuery({
    queryKey: ['dish', id],
    queryFn: () => foodItemService.get(id),
    enabled: Boolean(id),
  });

  const category = dish.data?.category;
  const related = useQuery({
    queryKey: ['dishes', 'category', category],
    queryFn: () => foodItemService.list({ category, limit: 60 }),
    enabled: Boolean(category),
  });

  const addToCart = useAddToCart();
  const favoriteIds = useFavoriteFoodIds();
  const toggleFavorite = useToggleFavorite();

  if (dish.isError) {
    return (
      <ErrorState
        title="Dish not found"
        message="This dish may have been removed from the menu."
        action={
          <Link href="/dishes">
            <Button variant="secondary">Back to dishes</Button>
          </Link>
        }
      />
    );
  }

  if (dish.isLoading || !dish.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton height={220} radius={20} />
        <Skeleton height={220} radius={16} />
      </div>
    );
  }

  const item = dish.data;
  const compareHref = `/compare?q=${encodeURIComponent(item.displayName)}`;
  const relatedItems = (related.data?.items ?? []).filter((candidate) => candidate.id !== item.id);

  return (
    <div className="flex flex-col gap-10">
      <Link
        href="/dishes"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-primary"
      >
        ← Back to dishes
      </Link>

      <section className="grid gap-6 overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-sm sm:grid-cols-[minmax(0,320px)_1fr] sm:p-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-alt">
          <FoodImage
            src={item.imageUrl}
            alt={item.displayName}
            category={item.category}
            seed={item.id}
            priority
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3">
            <DietBadge dietaryType={item.dietaryType} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {item.category}
              {item.portionSize ? ` · ${item.portionSize}` : ''}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {item.displayName}
            </h1>
            {item.description ? (
              <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(item.mealTypes ?? []).map((meal) => (
              <Badge key={meal} tone="info">
                {MEAL_LABELS[meal] ?? meal}
              </Badge>
            ))}
            {item.restaurant ? (
              <Link href={`/restaurants/${item.restaurant.id}`}>
                <Badge tone="success">{item.restaurant.displayName}</Badge>
              </Link>
            ) : null}
          </div>

          {item.variants?.length ? (
            <div className="rounded-2xl border border-line bg-surface-alt/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Variants</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink">
                {item.variants.map((variant) => (
                  <li key={variant.name} className="flex items-center justify-between gap-3">
                    <span>{variant.name}</span>
                    {variant.price != null ? (
                      <span className="font-semibold">{formatCurrency(variant.price)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Link
              href={compareHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <ArrowLeftRight className="h-4 w-4" /> Compare prices
            </Link>
            <button
              type="button"
              onClick={() => addToCart.mutate({ foodItemId: item.id, quantity: 1 })}
              disabled={addToCart.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Add to cart
            </button>
          </div>
        </div>
      </section>

      {category ? (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              All {category} options
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Every {category.toLowerCase()} dish on FoodCompare, ready to compare.
            </p>
          </div>

          {related.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[320px] animate-pulse rounded-3xl border border-line bg-surface-alt"
                />
              ))}
            </div>
          ) : relatedItems.length ? (
            <FoodGrid
              items={relatedItems}
              showFavorites
              favoriteIds={favoriteIds}
              onToggleFavorite={(foodItemId) => toggleFavorite.mutate(foodItemId)}
              detailHrefBase="/dishes"
              emptyMessage="No other dishes in this category yet."
            />
          ) : (
            <p className="text-sm text-muted">
              No other {category.toLowerCase()} dishes are listed yet.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
