'use client';

import { ExternalLink } from 'lucide-react';
import type { ProviderQuote } from '@/types';

interface OrderPlatformButtonProps {
  quote: ProviderQuote;
  className?: string;
}

/**
 * Order action that only ever uses the backend-provided `officialOrderUrl`.
 * When no URL or capability is supplied we surface a disabled state instead of
 * guessing or constructing a link.
 */
export function OrderPlatformButton({ quote, className }: OrderPlatformButtonProps) {
  const canOrder = quote.orderingCapability !== 'none' && Boolean(quote.officialOrderUrl);

  if (!canOrder) {
    return (
      <span
        className={[
          'inline-flex items-center justify-center rounded-full border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-muted',
          className ?? '',
        ].join(' ')}
        title="No verified ordering link is available for this provider yet."
      >
        Ordering unavailable
      </span>
    );
  }

  return (
    <a
      href={quote.officialOrderUrl as string}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark',
        className ?? '',
      ].join(' ')}
    >
      Order on {quote.providerName}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
