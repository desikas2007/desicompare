'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { FoodSearch } from '@/components/food/FoodSearch';
import { FoodGrid } from '@/components/food/FoodGrid';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { Pagination } from '@/components/ui/Pagination';
import { searchService } from '@/services/search.service';
import { providerService } from '@/services/provider.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavoriteFoodIds, useToggleFavorite } from '@/hooks/useFavorites';
import type { DietaryType, SearchFilters } from '@/types';

const DIETARY: Array<{ value: DietaryType | ''; label: string }> = [
  { value: '', label: 'Any' },
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-veg' },
  { value: 'vegan', label: 'Vegan' },
];

const SORTS: Array<{ value: NonNullable<SearchFilters['sort']>; label: string }> = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Top rated' },
  { value: 'delivery_asc', label: 'Fastest delivery' },
];

const inputClass =
  'w-full rounded-2xl border border-line bg-surface-alt px-4 py-2.5 text-sm text-ink outline-none focus:border-primary';

export function SearchView() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 400);
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [provider, setProvider] = useState(params.get('provider') ?? '');
  const [dietaryType, setDietaryType] = useState<DietaryType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<NonNullable<SearchFilters['sort']>>(
    (params.get('sort') as SearchFilters['sort']) ?? 'relevance',
  );
  const [page, setPage] = useState(1);

  const providers = useQuery({ queryKey: ['providers'], queryFn: () => providerService.list() });
  const favoriteIds = useFavoriteFoodIds();
  const toggleFavorite = useToggleFavorite();

  const filters: SearchFilters = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      category: category || undefined,
      provider: provider || undefined,
      dietaryType: dietaryType || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      limit: 12,
    }),
    [debouncedQuery, category, provider, dietaryType, minPrice, maxPrice, sort, page],
  );

  const search = useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchService.search(filters),
    placeholderData: (previous) => previous,
  });

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function resetFilters() {
    setCategory('');
    setProvider('');
    setDietaryType('');
    setMinPrice('');
    setMaxPrice('');
    setSort('relevance');
    setPage(1);
  }

  const foodItems = search.data?.foodItems;
  const total = foodItems?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Search food &amp; restaurants
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Find a dish, then compare its delivered price across providers.
          </p>
        </div>
        <div className="max-w-2xl">
          <FoodSearch value={query} onChange={updateQuery} autoFocus />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
              <SlidersHorizontal className="h-4 w-4 text-muted" /> Filters
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-primary hover:text-primary-dark"
            >
              Reset all
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Dietary</span>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((option) => (
                <button
                  key={option.value || 'any'}
                  type="button"
                  onClick={() => {
                    setDietaryType(option.value);
                    setPage(1);
                  }}
                  className={[
                    'rounded-pill border px-3 py-1.5 text-xs font-semibold transition',
                    dietaryType === option.value
                      ? 'border-primary bg-primary-soft text-primary-dark'
                      : 'border-line bg-surface text-ink-soft hover:border-primary/40',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Provider</span>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All providers</option>
              {(providers.data ?? []).map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Price range (₹)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(event.target.value);
                  setPage(1);
                }}
                aria-label="Minimum price"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value);
                  setPage(1);
                }}
                aria-label="Maximum price"
                className={inputClass}
              />
            </div>
          </div>

          {search.data?.categories?.length ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {search.data.categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategory(category === item ? '' : item);
                      setPage(1);
                    }}
                    className={[
                      'rounded-pill border px-3 py-1.5 text-xs font-semibold transition',
                      category === item
                        ? 'border-primary bg-primary-soft text-primary-dark'
                        : 'border-line bg-surface text-ink-soft hover:border-primary/40',
                    ].join(' ')}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">
              {search.isFetching && total === 0 ? 'Searching…' : `${total} dishes found`}
            </span>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Sort
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as NonNullable<SearchFilters['sort']>);
                  setPage(1);
                }}
                className="rounded-2xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {search.data?.restaurants?.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Matching restaurants
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {search.data.restaurants.slice(0, 4).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            </section>
          ) : null}

          {search.isError ? (
            <div className="rounded-3xl border border-danger/30 bg-danger-soft px-6 py-10 text-center text-sm text-danger">
              Search failed. Please try again.
            </div>
          ) : search.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[320px] animate-pulse rounded-3xl border border-line bg-surface-alt"
                />
              ))}
            </div>
          ) : foodItems && foodItems.items.length ? (
            <>
              <FoodGrid
                items={foodItems.items}
                showFavorites
                favoriteIds={favoriteIds}
                onToggleFavorite={(id) => toggleFavorite.mutate(id)}
              />
              <Pagination
                page={foodItems.meta.page}
                totalPages={foodItems.meta.totalPages}
                total={foodItems.meta.total}
                onChange={setPage}
              />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-ink">No dishes found</p>
              <p className="mt-1 text-sm text-ink-soft">
                Try a different keyword, or clear your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
