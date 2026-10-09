'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { FoodCard } from '@/components/food/FoodCard';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Form';
import { searchService } from '@/services/search.service';
import { providerService } from '@/services/provider.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { DietaryType, SearchFilters } from '@/types';
import styles from './searchview.module.css';

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
    <div className={`container ${'section'}`}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="section-title">Search food & restaurants</h1>
        <p className="section-subtitle">Find a dish, then compare its delivered price across providers.</p>
        <SearchBar initialValue={query} onSearch={updateQuery} autoFocus />
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Filters">
          <div className={styles.filterGroup}>
            <p className={styles.sidebarTitle}>Filters</p>
            <button type="button" className={styles.chip} onClick={resetFilters}>
              Reset all
            </button>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Dietary</span>
            <div className={styles.chips}>
              {DIETARY.map((option) => (
                <button
                  key={option.value || 'any'}
                  type="button"
                  className={[styles.chip, dietaryType === option.value ? styles.chipActive : ''].join(' ')}
                  onClick={() => {
                    setDietaryType(option.value);
                    setPage(1);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Provider</span>
            <Select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All providers</option>
              {(providers.data ?? []).map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Price range (₹)</span>
            <div className={styles.priceRow}>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(event.target.value);
                  setPage(1);
                }}
                aria-label="Minimum price"
                style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.6rem' }}
              />
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value);
                  setPage(1);
                }}
                aria-label="Maximum price"
                style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.6rem' }}
              />
            </div>
          </div>

          {search.data?.categories?.length ? (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Categories</span>
              <div className={styles.chips}>
                {search.data.categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={[styles.chip, category === item ? styles.chipActive : ''].join(' ')}
                    onClick={() => {
                      setCategory(category === item ? '' : item);
                      setPage(1);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <div>
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              {search.isFetching && total === 0 ? 'Searching…' : `${total} dishes found`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="sort" className={styles.filterLabel}>Sort</label>
              <Select
                id="sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as NonNullable<SearchFilters['sort']>);
                  setPage(1);
                }}
                style={{ width: 'auto' }}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {search.data?.restaurants?.length ? (
            <>
              <h2 className={styles.sidebarTitle} style={{ marginBottom: 'var(--space-3)' }}>Matching restaurants</h2>
              <div className={styles.restaurantStrip}>
                {search.data.restaurants.slice(0, 4).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            </>
          ) : null}

          {search.isError ? (
            <ErrorState message="Search failed. Please try again." />
          ) : search.isLoading ? (
            <div className="grid grid-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} height={300} radius={18} />
              ))}
            </div>
          ) : foodItems && foodItems.items.length ? (
            <>
              <div className="grid grid-3">
                {foodItems.items.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
              <Pagination
                page={foodItems.meta.page}
                totalPages={foodItems.meta.totalPages}
                total={foodItems.meta.total}
                onChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No dishes found"
              message="Try a different keyword, or clear your filters."
            />
          )}
        </div>
      </div>
    </div>
  );
}
