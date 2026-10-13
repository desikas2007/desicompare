'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, UtensilsCrossed } from 'lucide-react';
import { FoodCategoryNav } from '@/components/food/FoodCategoryNav';
import { FoodGrid } from '@/components/food/FoodGrid';
import { FoodSection } from '@/components/food/FoodSection';
import { Pagination } from '@/components/ui/Pagination';
import { searchService } from '@/services/search.service';
import { useFavoriteFoodIds, useToggleFavorite } from '@/hooks/useFavorites';
import { MealTypeEnum } from '@/types';
import type { MealType, SearchFoodItem } from '@/types';

const MEAL_TABS: Array<{ value: MealType | 'all'; label: string; emoji: string }> = [
  { value: 'all', label: 'All dishes', emoji: '✨' },
  { value: MealTypeEnum.Breakfast, label: 'Breakfast', emoji: '🥞' },
  { value: MealTypeEnum.Lunch, label: 'Lunch', emoji: '🍱' },
  { value: MealTypeEnum.Dinner, label: 'Dinner', emoji: '🍽️' },
];

const MEAL_RAIL_LIMIT = 12;
const CATEGORY_RAIL_LIMIT = 12;
const MAX_CATEGORY_RAILS = 12;
const PAGE_SIZE = 12;

function isMeal(value: string | null): value is MealType {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner';
}

export function DishesView() {
  const params = useSearchParams();
  const initialMeal = params.get('meal');
  const [meal, setMeal] = useState<MealType | 'all'>(isMeal(initialMeal) ? initialMeal : 'all');
  const [category, setCategory] = useState<string | null>(params.get('category'));
  const [page, setPage] = useState(1);

  const favoriteIds = useFavoriteFoodIds();
  const toggleFavorite = useToggleFavorite();
  const onToggleFavorite = (id: string) => toggleFavorite.mutate(id);

  const browsingAll = meal === 'all' && !category;

  const overview = useQuery({
    queryKey: ['dishes', 'overview'],
    queryFn: () => searchService.search({ page: 1, limit: 120, sort: 'relevance' }),
    enabled: browsingAll,
    staleTime: 60_000,
  });

  const filtered = useQuery({
    queryKey: ['dishes', { meal, category, page }],
    queryFn: () =>
      searchService.search({
        mealType: meal === 'all' ? undefined : meal,
        category: category ?? undefined,
        page,
        limit: PAGE_SIZE,
        sort: 'relevance',
      }),
    enabled: !browsingAll,
    placeholderData: (previous) => previous,
  });

  const overviewItems = useMemo<SearchFoodItem[]>(
    () => overview.data?.foodItems.items ?? [],
    [overview.data],
  );

  const mealSections = useMemo(
    () =>
      (
        [
          { meal: MealTypeEnum.Breakfast, title: 'Breakfast', subtitle: 'Start the day right', emoji: '🥞' },
          { meal: MealTypeEnum.Lunch, title: 'Lunch', subtitle: 'Midday meals worth comparing', emoji: '🍱' },
          { meal: MealTypeEnum.Dinner, title: 'Dinner', subtitle: 'Evening plates to look forward to', emoji: '🍽️' },
        ] as const
      ).map((section) => ({
        ...section,
        items: overviewItems
          .filter((item) => item.mealTypes?.includes(section.meal))
          .slice(0, MEAL_RAIL_LIMIT),
      })),
    [overviewItems],
  );

  const categorySections = useMemo(() => {
    const byCategory = new Map<string, SearchFoodItem[]>();
    for (const item of overviewItems) {
      const key = item.category?.trim();
      if (!key) continue;
      const list = byCategory.get(key) ?? [];
      list.push(item);
      byCategory.set(key, list);
    }
    return [...byCategory.entries()]
      .filter(([, items]) => items.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_CATEGORY_RAILS)
      .map(([name, items]) => ({ name, items: items.slice(0, CATEGORY_RAIL_LIMIT) }));
  }, [overviewItems]);

  const categories = overview.data?.categories ?? filtered.data?.categories ?? [];
  const activeList = filtered.data?.foodItems;

  function selectMeal(value: MealType | 'all') {
    setMeal(value);
    setPage(1);
  }

  function selectCategory(value: string | null) {
    setCategory(value);
    setPage(1);
  }

  const heading = category ?? (meal === 'all' ? 'All dishes' : meal[0].toUpperCase() + meal.slice(1));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            Dishes menu
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Browse every dish
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pick a meal or a category — tap Chicken Biryani to reveal every biryani on the menu.
          </p>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {MEAL_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => selectMeal(tab.value)}
              aria-pressed={meal === tab.value}
              className={[
                'flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-sm font-semibold transition',
                meal === tab.value
                  ? 'border-primary bg-primary-soft text-primary-dark'
                  : 'border-line bg-surface text-ink hover:border-primary/40 hover:text-primary',
              ].join(' ')}
            >
              <span aria-hidden>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {categories.length ? (
        <FoodCategoryNav categories={categories} active={category} onSelect={selectCategory} />
      ) : null}

      {browsingAll ? (
        overview.isLoading ? (
          <SkeletonGrid />
        ) : overview.isError ? (
          <ErrorBox />
        ) : (
          <div className="flex flex-col gap-10">
            {mealSections.map((section) =>
              section.items.length ? (
                <FoodSection
                  key={section.meal}
                  title={`${section.emoji} ${section.title}`}
                  subtitle={section.subtitle}
                  items={section.items}
                  href={`/dishes?meal=${section.meal}`}
                  showFavorites
                  favoriteIds={favoriteIds}
                  onToggleFavorite={onToggleFavorite}
                  detailHrefBase="/dishes"
                />
              ) : null,
            )}

            {categorySections.map((section) => (
              <FoodSection
                key={section.name}
                title={`All ${section.name}`}
                subtitle={`Every ${section.name} dish on the menu`}
                items={section.items}
                href={`/dishes?category=${encodeURIComponent(section.name)}`}
                showFavorites
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
                detailHrefBase="/dishes"
              />
            ))}

            {!mealSections.some((section) => section.items.length) &&
            !categorySections.length ? (
              <EmptyBox />
            ) : null}
          </div>
        )
      ) : (
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{heading}</h2>
            {activeList ? (
              <span className="text-sm text-muted">{activeList.meta.total} dishes</span>
            ) : null}
          </div>

          {filtered.isError ? (
            <ErrorBox />
          ) : filtered.isLoading ? (
            <SkeletonGrid />
          ) : activeList && activeList.items.length ? (
            <>
              <FoodGrid
                items={activeList.items}
                showFavorites
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
                detailHrefBase="/dishes"
                emptyMessage="No dishes here yet."
              />
              <Pagination
                page={activeList.meta.page}
                totalPages={activeList.meta.totalPages}
                total={activeList.meta.total}
                onChange={setPage}
              />
            </>
          ) : (
            <EmptyBox />
          )}
        </section>
      )}
    </div>
  );
}

function SkeletonGrid() {
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

function ErrorBox() {
  return (
    <div className="rounded-3xl border border-danger/30 bg-danger-soft px-6 py-10 text-center text-sm text-danger">
      We could not load the dishes. Please try again.
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">No dishes here yet</p>
      <p className="mt-1 text-sm text-ink-soft">Try another meal or category.</p>
      <Link
        href="/dishes"
        className="mt-5 inline-flex items-center gap-1 rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Browse all dishes
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
