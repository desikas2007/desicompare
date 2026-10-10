'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavoriteFoodIds, useToggleFavorite } from '@/hooks/useFavorites';
import { searchService } from '@/services/search.service';
import { FoodSearch } from '@/components/food/FoodSearch';
import { FoodCategoryNav } from '@/components/food/FoodCategoryNav';
import { FoodSection } from '@/components/food/FoodSection';
import { FoodGrid } from '@/components/food/FoodGrid';
import { categoryEmoji, timeOfDayGreeting } from '@/lib/imagery';

const FALLBACK_CATEGORIES = [
  'Biryani',
  'Pizza',
  'South Indian',
  'Momos',
  'Noodles',
  'Fried Rice',
  'Burgers',
  'Beverages',
  'Desserts',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 350);

  const discovery = useDiscovery();
  const favoriteIds = useFavoriteFoodIds();
  const toggleFavorite = useToggleFavorite();

  const searchTerm = debouncedQuery.trim();
  const searching = searchTerm.length > 0 || category !== null;

  const searchResults = useQuery({
    queryKey: ['search', { q: searchTerm, category, scope: 'discover' }],
    queryFn: () =>
      searchService.search({
        q: searchTerm || undefined,
        category: category ?? undefined,
        page: 1,
        limit: 24,
        sort: 'relevance',
      }),
    enabled: searching,
    staleTime: 30_000,
  });

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const onToggleFavorite = (id: string) => toggleFavorite.mutate(id);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            {timeOfDayGreeting()}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            What are you craving today?
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Search a dish to compare delivered prices across every platform.
          </p>
        </div>
        <div className="max-w-2xl">
          <FoodSearch value={query} onChange={setQuery} />
        </div>
      </header>

      <FoodCategoryNav
        categories={discovery.categories}
        active={category}
        onSelect={(next) => setCategory(next)}
      />

      {searching ? (
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {category ?? `Results for “${searchTerm}”`}
            </h2>
            {searchResults.data ? (
              <span className="text-sm text-muted">
                {searchResults.data.foodItems.meta.total} dishes
              </span>
            ) : null}
          </div>

          {searchResults.isError ? (
            <div className="rounded-3xl border border-danger/30 bg-danger-soft px-6 py-10 text-center text-sm text-danger">
              We could not load results. Please try again.
            </div>
          ) : searchResults.isLoading ? (
            <ResultsSkeleton />
          ) : (
            <FoodGrid
              items={searchResults.data?.foodItems.items ?? []}
              showFavorites
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              emptyMessage="No dishes matched. Try another keyword or category."
            />
          )}
        </section>
      ) : discovery.isLoading ? (
        <ResultsSkeleton />
      ) : discovery.isError ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-danger/30 bg-danger-soft px-6 py-4 text-center text-sm text-danger">
            We could not load the discovery feed. Try again in a moment.
          </div>
          <QuickCategories title="Meanwhile, jump into a category" />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {discovery.recommended.length ? (
            <FoodSection
              title="Recommended for you"
              subtitle="Popular picks ranked by how many platforms stock them"
              items={discovery.recommended}
              showFavorites
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
            />
          ) : null}

          {discovery.sections.map((section) => (
            <FoodSection
              key={section.key}
              title={section.category ?? 'More to explore'}
              subtitle={section.category ? undefined : 'Other dishes worth a look'}
              items={section.items}
              href={section.category ? `/search?category=${encodeURIComponent(section.category)}` : undefined}
              showFavorites
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
            />
          ))}

          {!discovery.recommended.length && !discovery.sections.length ? (
            <QuickCategories title="Nothing to show yet — explore a classic" />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-[320px] animate-pulse rounded-3xl border border-line bg-surface-alt"
        />
      ))}
    </div>
  );
}

function QuickCategories({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-10 text-center">
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">
        Pick a classic to see delivered prices across platforms.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {FALLBACK_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/search?category=${encodeURIComponent(category)}`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary/40 hover:text-primary"
          >
            <span aria-hidden>{categoryEmoji(category)}</span>
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}
