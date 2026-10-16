/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { resolveFoodImage } from '@/lib/imagery';

interface FoodImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  seed?: string;
  /** Dish name — drives a dish-specific photo when no real `src` is available. */
  name?: string | null;
  className?: string;
  /** Above-the-fold images can opt into eager loading. */
  priority?: boolean;
}

/**
 * Image with a guaranteed fallback.
 *
 * Provider/demo image URLs can come from arbitrary hosts, so we intentionally
 * use a native <img> (as the rest of the app does) with lazy loading. Resolution
 * is two-tiered: a real API `src` or a dish-specific decorative photo first, and
 * an always-available local/category photo on error. This prevents broken image
 * icons without backend changes.
 */
export function FoodImage({ src, alt, category, seed, name, className, priority }: FoodImageProps) {
  const fallback = resolveFoodImage(null, category, seed);
  const [current, setCurrent] = useState(() => resolveFoodImage(src, category, seed, name));

  useEffect(() => {
    setCurrent(resolveFoodImage(src, category, seed, name));
  }, [src, category, seed, name]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
