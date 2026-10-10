/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { resolveFoodImage } from '@/lib/imagery';

interface FoodImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  seed?: string;
  className?: string;
  /** Above-the-fold images can opt into eager loading. */
  priority?: boolean;
}

/**
 * Image with a guaranteed fallback.
 *
 * Provider/demo image URLs can come from arbitrary hosts, so we intentionally
 * use a native <img> (as the rest of the app does) with lazy loading and an
 * on-error swap to a deterministic decorative photo. This prevents broken
 * image icons without needing backend changes or extra image-host config.
 */
export function FoodImage({ src, alt, category, seed, className, priority }: FoodImageProps) {
  const fallback = resolveFoodImage(null, category, seed);
  const [current, setCurrent] = useState(() => resolveFoodImage(src, category, seed));

  useEffect(() => {
    setCurrent(resolveFoodImage(src, category, seed));
  }, [src, category, seed]);

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
