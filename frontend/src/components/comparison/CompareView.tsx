'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { MapPin, Sparkles } from 'lucide-react';
import { comparisonService } from '@/services/comparison.service';
import { providerService } from '@/services/provider.service';
import { ComparisonResultView } from './ComparisonResultView';
import { FoodImage } from '@/components/food/FoodImage';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api-client';

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CompareView() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [location, setLocation] = useState('Chennai, Tamil Nadu');
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const ranInitial = useRef(false);

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

  const { mutate } = comparison;

  useEffect(() => {
    const initial = (params.get('q') ?? '').trim();
    if (initial && !ranInitial.current) {
      ranInitial.current = true;
      mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
          <Sparkles className="h-3.5 w-3.5" />
          Live price comparison
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Compare the real delivered price
        </h1>
        <p className="max-w-2xl text-ink-soft">
          We fetch a quote from every enabled provider and rank them by the final total — fees, taxes
          and discounts included.
        </p>
      </header>

      <form
        className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6"
        onSubmit={submit}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 lg:col-span-1">
            <span className="text-sm font-semibold text-ink">Dish or keyword</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. chicken biryani"
              className="rounded-2xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MapPin className="h-4 w-4 text-muted" /> Delivery location
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or area"
              className="rounded-2xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Quantity</span>
            <select
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="rounded-2xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none focus:border-primary"
            >
              {QUANTITY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink">Providers (optional)</span>
          <div className="flex flex-wrap gap-2">
            {(providers.data ?? []).map((provider) => {
              const active = selected.includes(provider.slug);
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => toggleProvider(provider.slug)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                    active
                      ? 'border-primary bg-primary-soft text-primary-dark'
                      : 'border-line bg-surface text-ink hover:border-primary/40',
                  ].join(' ')}
                >
                  {provider.name}
                  <Badge tone={provider.integrationMode === 'demo' ? 'warning' : 'neutral'}>
                    {provider.integrationMode}
                  </Badge>
                </button>
              );
            })}
            {!providers.data?.length ? (
              <span className="text-sm text-muted">No providers available.</span>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</p>
        ) : null}

        <button
          type="submit"
          disabled={comparison.isPending}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70 sm:w-fit"
        >
          {comparison.isPending ? 'Comparing prices…' : 'Compare prices'}
        </button>
      </form>

      <div className="flex flex-col gap-6">
        {comparison.isPending ? (
          <ComparisonSkeleton query={query} />
        ) : comparison.isError ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-soft px-6 py-10 text-center text-sm text-danger">
            {formError ?? 'We could not complete this comparison.'}
          </div>
        ) : comparison.data ? (
          <ComparisonResultView result={comparison.data} />
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-surface-alt/60 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-ink">No comparison yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Enter a dish above to see how each provider prices the same order.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonSkeleton({ query }: { query: string }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-alt">
          <FoodImage alt="" name={query} seed={query} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Comparing “{query}” across providers…</p>
          <p className="text-xs text-ink-soft">
            Fetching live quotes and calculating the delivered total.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton height={150} radius={24} />
        <Skeleton height={150} radius={24} />
      </div>
      <Skeleton height={260} radius={24} />
    </div>
  );
}
