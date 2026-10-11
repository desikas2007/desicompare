'use client';

import { useState } from 'react';
import { ChevronRight, Clock, ExternalLink, Minus, TrendingDown } from 'lucide-react';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { formatCurrency, formatMinutes, titleCase } from '@/lib/format';
import { OrderPlatformButton } from '@/components/comparison/OrderPlatformButton';
import type { ComparisonResult, ProviderQuote } from '@/types';

function statusTone(status: string) {
  switch (status) {
    case 'complete':
      return 'success' as const;
    case 'estimated':
      return 'warning' as const;
    case 'unavailable':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
}

function feeRows(quote: ProviderQuote): Array<[string, number]> {
  const { breakdown } = quote;
  return [
    ['Item subtotal', breakdown.itemSubtotal],
    ['Item discount', -breakdown.itemDiscount],
    ['Delivery fee', breakdown.deliveryFee],
    ['Platform fee', breakdown.platformFee],
    ['Packaging', breakdown.packagingFee],
    ['Taxes', breakdown.tax],
    ['Other fees', breakdown.otherFees],
    ['Coupon discount', -breakdown.couponDiscount],
  ];
}

const FEE_LABELS = [
  'Item subtotal',
  'Item discount',
  'Delivery fee',
  'Platform fee',
  'Packaging',
  'Taxes',
  'Other fees',
  'Coupon discount',
];

function isBestQuote(result: ComparisonResult, quote: ProviderQuote): boolean {
  return Boolean(
    result.bestQuote &&
      result.bestQuote.providerId === quote.providerId &&
      result.bestQuote.providerSlug === quote.providerSlug,
  );
}

/**
 * Provider name that links out to the provider's page for this restaurant.
 * The URL always comes from the backend (`officialOrderUrl`), never guessed.
 * Opens in a new tab so users can go straight to the provider app.
 */
function ProviderNameLink({ quote, tight }: { quote: ProviderQuote; tight?: boolean }) {
  const name = (
    <span className="inline-flex items-center gap-1">
      {quote.providerName}
      {quote.officialOrderUrl ? <ExternalLink className="h-3.5 w-3.5" /> : null}
    </span>
  );

  if (!quote.officialOrderUrl) return <span>{name}</span>;

  return (
    <a
      href={quote.officialOrderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'group inline-flex items-center gap-1 transition',
        tight ? 'text-base font-bold text-ink hover:text-primary' : 'text-xs font-normal hover:underline',
      ].join(' ')}
      title={`Open ${quote.providerName} in a new tab`}
    >
      {name}
    </a>
  );
}

/* ----------------------------- Desktop table ---------------------------- */

function ComparisonTable({ result, quotes }: { result: ComparisonResult; quotes: ProviderQuote[] }) {
  const activeFeeLabels = FEE_LABELS.filter((label) =>
    quotes.some((quote) => feeRows(quote).some(([name, value]) => name === label && value !== 0)),
  );

  return (
    <div className="hidden overflow-hidden rounded-3xl border border-line bg-surface lg:block">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-4 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-muted">
                Compare
              </th>
              {quotes.map((quote) => {
                const best = isBestQuote(result, quote);
                return (
                  <th
                    key={`${quote.providerId}-${quote.providerSlug}`}
                    className={[
                      'min-w-[190px] border-l border-line p-4 text-left align-bottom',
                      best ? 'bg-primary-soft' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <ProviderNameLink quote={quote} tight />
                      {best ? <Badge tone="success">Best price</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs font-normal text-ink-soft">{quote.restaurantName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={statusTone(quote.quoteStatus)}>{titleCase(quote.quoteStatus)}</Badge>
                      <DemoBadge isDemo={quote.sourceType === 'demo'} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="sticky left-0 z-10 bg-surface p-4 font-semibold text-ink">Estimated total</td>
              {quotes.map((quote) => {
                const best = isBestQuote(result, quote);
                return (
                  <td
                    key={`${quote.providerId}-total`}
                    className={[
                      'border-l border-line p-4',
                      best ? 'bg-primary-soft' : '',
                    ].join(' ')}
                  >
                    <span className="text-lg font-bold text-ink">
                      {formatCurrency(quote.breakdown.estimatedTotal, quote.currency)}
                    </span>
                  </td>
                );
              })}
            </tr>
            {activeFeeLabels.map((label) => (
              <tr key={label} className="border-t border-line">
                <td className="sticky left-0 z-10 bg-surface p-4 text-ink-soft">{label}</td>
                {quotes.map((quote) => {
                  const value = feeRows(quote).find(([name]) => name === label)?.[1] ?? 0;
                  const best = isBestQuote(result, quote);
                  return (
                    <td
                      key={`${quote.providerId}-${label}`}
                      className={['border-l border-line p-4 text-ink', best ? 'bg-primary-soft/60' : ''].join(
                        ' ',
                      )}
                    >
                      {value === 0 ? <Minus className="h-4 w-4 text-muted" /> : formatCurrency(value, quote.currency)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-line">
              <td className="sticky left-0 z-10 bg-surface p-4 text-ink-soft">Est. delivery</td>
              {quotes.map((quote) => (
                <td
                  key={`${quote.providerId}-eta`}
                  className={[
                    'border-l border-line p-4',
                    isBestQuote(result, quote) ? 'bg-primary-soft/60' : '',
                  ].join(' ')}
                >
                  {quote.estimatedDeliveryMinutes != null ? (
                    <span className="inline-flex items-center gap-1 text-ink">
                      <Clock className="h-3.5 w-3.5 text-muted" />
                      {formatMinutes(quote.estimatedDeliveryMinutes)}
                    </span>
                  ) : (
                    <Minus className="h-4 w-4 text-muted" />
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="sticky left-0 z-10 bg-surface p-4" />
              {quotes.map((quote) => (
                <td
                  key={`${quote.providerId}-action`}
                  className={[
                    'border-l border-line p-4',
                    isBestQuote(result, quote) ? 'bg-primary-soft/60' : '',
                  ].join(' ')}
                >
                  <OrderPlatformButton quote={quote} className="w-full" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Mobile cards ----------------------------- */

function QuoteCard({ quote, isBest }: { quote: ProviderQuote; isBest: boolean }) {
  const [open, setOpen] = useState(false);
  const rows = feeRows(quote).filter(([, value]) => value !== 0);

  return (
    <div
      className={[
        'rounded-3xl border bg-surface p-4 shadow-sm',
        isBest ? 'border-primary' : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ProviderNameLink quote={quote} tight />
            {isBest ? <Badge tone="success">Best price</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {quote.restaurantName} · {quote.foodName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone(quote.quoteStatus)}>{titleCase(quote.quoteStatus)}</Badge>
            <DemoBadge isDemo={quote.sourceType === 'demo'} />
            {quote.estimatedDeliveryMinutes != null ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3.5 w-3.5" />
                {formatMinutes(quote.estimatedDeliveryMinutes)}
              </span>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-lg font-bold text-ink">
          {formatCurrency(quote.breakdown.estimatedTotal, quote.currency)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        {open ? 'Hide fee breakdown' : 'View fee breakdown'}
        <ChevronRight className={['h-4 w-4 transition', open ? 'rotate-90' : ''].join(' ')} />
      </button>

      {open ? (
        <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-ink-soft">
              <span>{label}</span>
              <span className="text-ink">{formatCurrency(value, quote.currency)}</span>
            </div>
          ))}
          {quote.notes?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
              {quote.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <OrderPlatformButton quote={quote} className="w-full" />
      </div>
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

export function ComparisonResultView({ result }: { result: ComparisonResult }) {
  const quotes = [...result.quotes].sort(
    (a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
            <TrendingDown className="h-4 w-4" />
            Cheapest option
          </span>
          {result.bestQuote ? (
            <>
              <ProviderNameLink quote={result.bestQuote} tight />
              <p className="text-sm text-ink-soft">
                {result.bestQuote.restaurantName} · {result.bestQuote.foodName} × {result.quantity}
              </p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {formatCurrency(result.bestQuote.breakdown.estimatedTotal, result.currency)}
              </p>
              <div className="mt-2">
                <DemoBadge isDemo={result.isDemoData} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">No available quote for this item.</p>
          )}
        </div>

        <div className="rounded-3xl border border-primary/30 bg-primary-soft p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-dark">
            Potential savings
          </span>
          <p className="mt-2 text-3xl font-bold text-primary-dark">
            {formatCurrency(result.potentialSavings, result.currency)}
          </p>
          <p className="mt-1 text-sm text-primary-dark/80">
            {result.savingsPercentage > 0
              ? `${result.savingsPercentage.toFixed(1)}% cheaper than the most expensive option`
              : 'All providers are priced similarly'}
          </p>
          <p className="mt-2 text-xs text-primary-dark/70">
            Match confidence: {titleCase(result.matchConfidence)}
            {result.matchNote ? ` — ${result.matchNote}` : ''}
          </p>
        </div>
      </div>

      {quotes.length ? (
        <>
          <ComparisonTable result={result} quotes={quotes} />
          <div className="grid gap-4 lg:hidden">
            {quotes.map((quote) => (
              <QuoteCard
                key={`${quote.providerId}-${quote.providerSlug}`}
                quote={quote}
                isBest={isBestQuote(result, quote)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 p-8 text-center text-sm text-ink-soft">
          No provider returned a usable quote.
        </div>
      )}
    </div>
  );
}
