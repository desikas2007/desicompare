'use client';

import { useState } from 'react';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatMinutes, titleCase } from '@/lib/format';
import type { ComparisonResult, ProviderQuote } from '@/types';
import styles from './comparison.module.css';

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

function Breakdown({ quote }: { quote: ProviderQuote }) {
  const { breakdown } = quote;
  const rows: Array<[string, number]> = [
    ['Item subtotal', breakdown.itemSubtotal],
    ['Item discount', -breakdown.itemDiscount],
    ['Delivery fee', breakdown.deliveryFee],
    ['Platform fee', breakdown.platformFee],
    ['Packaging', breakdown.packagingFee],
    ['Taxes', breakdown.tax],
    ['Other fees', breakdown.otherFees],
    ['Coupon discount', -breakdown.couponDiscount],
  ];
  return (
    <div className={styles.breakdown}>
      {rows
        .filter(([, value]) => value !== 0)
        .map(([label, value]) => (
          <div key={label} className={styles.breakdownRow}>
            <span>{label}</span>
            <span>{formatCurrency(value, quote.currency)}</span>
          </div>
        ))}
      <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
        <span>Estimated total</span>
        <span>{formatCurrency(breakdown.estimatedTotal, quote.currency)}</span>
      </div>
      {quote.notes && quote.notes.length ? (
        <div className={styles.notes}>
          <strong>Notes</strong>
          <ul className={styles.notesList}>
            {quote.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function QuoteRow({ quote, isBest }: { quote: ProviderQuote; isBest: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.quote} ${isBest ? styles.quoteBest : ''}`}>
      <div className={styles.quoteHeader}>
        <div className={styles.quoteProvider}>
          <span className={styles.quoteName}>
            {quote.providerName} {isBest ? <Badge tone="success">Best price</Badge> : null}
          </span>
          <span className={styles.quoteSub}>
            {quote.restaurantName} · {quote.foodName}
            {quote.estimatedDeliveryMinutes != null
              ? ` · ~${formatMinutes(quote.estimatedDeliveryMinutes)}`
              : ''}
          </span>
          <span className={styles.quoteSub}>
            <Badge tone={statusTone(quote.quoteStatus)}>{titleCase(quote.quoteStatus)}</Badge>{' '}
            <DemoBadge isDemo={quote.sourceType === 'demo'} />
          </span>
        </div>
        <div className={styles.quoteTotals}>
          <div className={styles.quoteTotal}>{formatCurrency(quote.breakdown.estimatedTotal, quote.currency)}</div>
        </div>
        <div className={styles.quoteActions}>
          <Button variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
            {open ? 'Hide fees' : 'View fees'}
          </Button>
          {quote.orderingCapability === 'external' && quote.officialOrderUrl ? (
            <a href={quote.officialOrderUrl} target="_blank" rel="noreferrer noopener">
              <Button size="sm">Order on {quote.providerName}</Button>
            </a>
          ) : null}
        </div>
      </div>
      {open ? <Breakdown quote={quote} /> : null}
    </div>
  );
}

export function ComparisonResultView({ result }: { result: ComparisonResult }) {
  const quotes = [...result.quotes].sort(
    (a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal,
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <div className={styles.bestCard}>
          <span className={styles.bestLabel}>★ Cheapest option</span>
          {result.bestQuote ? (
            <>
              <p className={styles.bestProvider}>{result.bestQuote.providerName}</p>
              <p className={styles.bestMeta}>
                {result.bestQuote.restaurantName} · {result.bestQuote.foodName} × {result.quantity}
              </p>
              <p className={styles.bestTotal}>
                {formatCurrency(result.bestQuote.breakdown.estimatedTotal, result.currency)}
              </p>
              <DemoBadge isDemo={result.isDemoData} />
            </>
          ) : (
            <p className={styles.bestMeta}>No available quote for this item.</p>
          )}
        </div>
        <div className={styles.savingsCard}>
          <span className={styles.savingsLabel}>Potential savings</span>
          <span className={styles.savingsValue}>{formatCurrency(result.potentialSavings, result.currency)}</span>
          <span className={styles.savingsLabel}>
            {result.savingsPercentage > 0
              ? `${result.savingsPercentage.toFixed(1)}% cheaper than the most expensive option`
              : 'All providers are priced similarly'}
          </span>
          <span className={styles.savingsLabel}>
            Match confidence: {titleCase(result.matchConfidence)}
            {result.matchNote ? ` — ${result.matchNote}` : ''}
          </span>
        </div>
      </div>

      <div className={styles.quotes}>
        {quotes.length ? (
          quotes.map((quote) => (
            <QuoteRow
              key={`${quote.providerId}-${quote.providerSlug}`}
              quote={quote}
              isBest={result.bestQuote?.providerId === quote.providerId}
            />
          ))
        ) : (
          <div className={styles.empty}>No provider returned a usable quote.</div>
        )}
      </div>
    </div>
  );
}
