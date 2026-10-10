'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { SearchBar } from '@/components/search/SearchBar';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { restaurantService } from '@/services/restaurant.service';
import { useDebounce } from '@/hooks/useDebounce';

export default function RestaurantsPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);

  const restaurants = useQuery({
    queryKey: ['restaurants', debouncedQuery, page],
    queryFn: () => restaurantService.list({ q: debouncedQuery || undefined, page, limit: 12 }),
    placeholderData: (previous) => previous,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Restaurants</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Browse restaurants available across the providers we track.
        </p>
      </header>

      <SearchBar
        initialValue={query}
        onSearch={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Search restaurants or cuisines…"
      />

      {restaurants.isError ? (
        <ErrorState message="Could not load restaurants." />
      ) : restaurants.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height={120} radius={16} />
          ))}
        </div>
      ) : restaurants.data && restaurants.data.items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.data.items.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
          <Pagination
            page={restaurants.data.meta.page}
            totalPages={restaurants.data.meta.totalPages}
            total={restaurants.data.meta.total}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState title="No restaurants found" message="Try a different search term." />
      )}
    </div>
  );
}
