'use client';

import Link from 'next/link';
import { Heart, Trash2, UtensilsCrossed } from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { userService } from '@/services/user.service';
import { FoodImage } from '@/components/food/FoodImage';
import { useToast } from '@/components/providers/ToastProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import type { FavoriteSummary } from '@/types';

export default function SavedPage() {
  const favorites = useFavorites();
  const queryClient = useQueryClient();
  const toast = useToast();
  const toggleFavorite = useToggleFavorite();

  const remove = useMutation({
    mutationFn: (id: string) => userService.removeFavorite(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.notify('Removed from wishlist');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not remove item');
    },
  });

  const items = favorites.data ?? [];
  const dishes = items.filter((favorite) => favorite.foodItemId);
  const restaurants = items.filter((favorite) => favorite.restaurantId && !favorite.foodItemId);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          <Heart className="h-6 w-6 text-primary" /> Your wishlist
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Saved dishes and restaurants you want to compare or revisit.
        </p>
      </header>

      {favorites.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl border border-line bg-surface-alt" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-ink">Nothing saved yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Tap the heart on any dish while browsing to build your wishlist.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Discover dishes
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {dishes.length ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-ink">Saved dishes</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dishes.map((favorite) => (
                  <DishRow
                    key={favorite.id}
                    favorite={favorite}
                    onRemove={() => remove.mutate(favorite.id)}
                    removing={remove.isPending}
                    onToggleFavorite={() => favorite.foodItemId && toggleFavorite.mutate(favorite.foodItemId)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {restaurants.length ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-ink">Saved restaurants</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-4 shadow-sm"
                  >
                    <Link
                      href={`/restaurants/${favorite.restaurantId}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                        <UtensilsCrossed size={18} />
                      </span>
                      <span className="truncate text-sm font-semibold text-ink">
                        {favorite.restaurantName ?? 'Restaurant'}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove.mutate(favorite.id)}
                      aria-label="Remove from wishlist"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-danger hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DishRow({
  favorite,
  onRemove,
  removing,
  onToggleFavorite,
}: {
  favorite: FavoriteSummary;
  onRemove: () => void;
  removing: boolean;
  onToggleFavorite: () => void;
}) {
  const name = favorite.foodItemName ?? 'Saved dish';

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 shadow-sm">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-alt">
        <FoodImage
          alt={name}
          category={null}
          seed={favorite.foodItemId ?? name}
          name={favorite.foodItemName}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <Link
          href={`/compare?q=${encodeURIComponent(name)}`}
          className="mt-1 inline-flex text-xs font-semibold text-primary hover:text-primary-dark"
        >
          Compare prices
        </Link>
      </div>
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={removing}
        aria-label="Remove from wishlist"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-primary transition hover:border-danger hover:text-danger disabled:opacity-60"
      >
        <Heart size={16} fill="currentColor" />
      </button>
    </div>
  );
}
