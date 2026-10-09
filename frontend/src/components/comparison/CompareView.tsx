'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { comparisonService } from '@/services/comparison.service';
import { providerService } from '@/services/provider.service';
import { ComparisonResultView } from './ComparisonResultView';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { ApiError } from '@/lib/api-client';
import styles from './compare.module.css';

export function CompareView() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const providers = useQuery({ queryKey: ['providers'], queryFn: () => providerService.list() });

  const comparison = useMutation({
    mutationFn: () =>
      comparisonService.create({
        query: query.trim(),
        location: location.trim() || undefined,
        quantity,
        providers: selected.length ? selected : undefined,
      }),
    onError: (error: unknown) => {
      setFormError(error instanceof ApiError ? error.message : 'Comparison failed');
    },
    onSuccess: () => setFormError(null),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      setFormError('Enter a dish to compare.');
      return;
    }
    setFormError(null);
    comparison.mutate();
  }

  function toggleProvider(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  return (
    <div className={`container section ${styles.wrap}`}>
      <div className={styles.header}>
        <h1 className="section-title">Compare delivered prices</h1>
        <p className="section-subtitle">
          We fetch a quote from every enabled provider and rank them by the final total — fees,
          taxes and discounts included.
        </p>
      </div>

      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.formGrid}>
          <Field label="Dish or keyword" htmlFor="cmp-query">
            <Input
              id="cmp-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. chicken biryani"
            />
          </Field>
          <Field label="Delivery location" htmlFor="cmp-location">
            <Input
              id="cmp-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or area"
            />
          </Field>
          <Field label="Quantity" htmlFor="cmp-qty">
            <Select
              id="cmp-qty"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className={styles.providerPicker}>
          <span className={styles.pickerLabel}>Providers (optional)</span>
          <div className={styles.chips}>
            {(providers.data ?? []).map((provider) => (
              <button
                key={provider.id}
                type="button"
                className={[styles.chip, selected.includes(provider.slug) ? styles.chipActive : ''].join(' ')}
                onClick={() => toggleProvider(provider.slug)}
              >
                {provider.name}
                <Badge tone={provider.integrationMode === 'demo' ? 'warning' : 'neutral'}>
                  {provider.integrationMode}
                </Badge>
              </button>
            ))}
            {!providers.data?.length ? <span className="muted">No providers available.</span> : null}
          </div>
        </div>

        {formError ? <p className={styles.error}>{formError}</p> : null}

        <Button type="submit" size="lg" loading={comparison.isPending}>
          Compare prices
        </Button>
      </form>

      <div className={styles.results}>
        {comparison.isPending ? (
          <div className="stack">
            <Skeleton height={140} radius={18} />
            <Skeleton height={90} radius={14} />
            <Skeleton height={90} radius={14} />
          </div>
        ) : comparison.isError ? (
          <ErrorState message={formError ?? 'We could not complete this comparison.'} />
        ) : comparison.data ? (
          <ComparisonResultView result={comparison.data} />
        ) : (
          <EmptyState
            title="No comparison yet"
            message="Enter a dish above to see how each provider prices the same order."
          />
        )}
      </div>
    </div>
  );
}
