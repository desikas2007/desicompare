'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import type { SearchFoodItem } from '@/types';

export interface DiscoverySection {
  key: string;
  /** Category used for the "View all" deep link, when applicable. */
  category: string | null;
  items: SearchFoodItem[];
}

export interface DiscoveryState {
  recommended: SearchFoodItem[];
  sections: DiscoverySection[];
  categories: string[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const RECOMMENDED_LIMIT = 4;
const SECTION_LIMIT = 8;
const MIN_SECTION_SIZE = 2;
const MAX_SECTIONS = 6;

/**
 * Builds the default (no-search) discovery experience from the existing public
 * search endpoint. We fetch one broad page of food items and derive sections
 * client-side, de-duplicating so the same dish never appears twice on the page.
 *
 * Sections are limited to what the data actually supports — categories with too
 * few items are merged into a single "More to explore" rail rather than shown
 * as sparse, fabricated sections.
 */
export function useDiscovery(): DiscoveryState {
  const query = useQuery({
    queryKey: ['discovery'],
    queryFn: () => searchService.search({ page: 1, limit: 120, sort: 'relevance' }),
    staleTime: 60_000,
  });

  const items = useMemo(() => query.data?.foodItems.items ?? [], [query.data]);

  const recommended = useMemo(() => {
    return [...items]
      .sort(
        (a, b) =>
          b.providerCount - a.providerCount || a.displayName.localeCompare(b.displayName),
      )
      .slice(0, RECOMMENDED_LIMIT);
  }, [items]);

  const sections = useMemo(() => {
    const used = new Set(recommended.map((item) => item.id));
    const byCategory = new Map<string, SearchFoodItem[]>();

    for (const item of items) {
      const key = item.category?.trim() || 'More to explore';
      const list = byCategory.get(key) ?? [];
      if (list.length >= SECTION_LIMIT || used.has(item.id)) continue;
      list.push(item);
      used.add(item.id);
      byCategory.set(key, list);
    }

    const primary: DiscoverySection[] = [];
    const leftovers: SearchFoodItem[] = [];

    for (const [category, list] of byCategory) {
      if (list.length >= MIN_SECTION_SIZE) {
        primary.push({ key: category, category, items: list });
      } else {
        leftovers.push(...list);
      }
    }

    primary.sort((a, b) => b.items.length - a.items.length);

    const result = primary.slice(0, MAX_SECTIONS);
    const overflow = primary.slice(MAX_SECTIONS).flatMap((section) => section.items);
    const more = [...leftovers, ...overflow].slice(0, SECTION_LIMIT);
    if (more.length >= MIN_SECTION_SIZE) {
      result.push({ key: 'more', category: null, items: more });
    }

    return result;
  }, [items, recommended]);

  return {
    recommended,
    sections,
    categories: query.data?.categories ?? [],
    total: query.data?.foodItems.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
