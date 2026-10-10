'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { offerService } from '@/services/offer.service';
import { providerService } from '@/services/provider.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, titleCase } from '@/lib/format';
import type { OfferSummary } from '@/types';

function discountLabel(offer: OfferSummary): string {
  if (offer.discountType === 'percentage') return `${offer.discountValue}% off`;
  return `${formatCurrency(offer.discountValue)} off`;
}

export default function OffersPage() {
  const [providerId, setProviderId] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);

  const providers = useQuery({ queryKey: ['providers'], queryFn: () => providerService.list() });
  const offers = useQuery({
    queryKey: ['offers', providerId, activeOnly, page],
    queryFn: () =>
      offerService.list({
        providerId: providerId || undefined,
        activeOnly,
        page,
        limit: 12,
      }),
    placeholderData: (previous) => previous,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Offers &amp; coupons</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Discounts we have recorded across providers. Always verify terms on the provider before
          ordering.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={providerId}
          onChange={(event) => {
            setProviderId(event.target.value);
            setPage(1);
          }}
          className="w-auto min-w-[12rem]"
          aria-label="Filter by provider"
        >
          <option value="">All providers</option>
          {(providers.data ?? []).map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </Select>
        <Button
          variant={activeOnly ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setActiveOnly((value) => !value);
            setPage(1);
          }}
        >
          {activeOnly ? 'Active only' : 'Showing all'}
        </Button>
      </div>

      {offers.isError ? (
        <ErrorState message="Could not load offers." />
      ) : offers.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height={200} radius={16} />
          ))}
        </div>
      ) : offers.data && offers.data.items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.data.items.map((offer) => (
              <article
                key={offer.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-lg font-extrabold text-primary">
                    <Tag className="h-4 w-4" />
                    {discountLabel(offer)}
                  </span>
                  <Badge
                    tone={
                      offer.verificationStatus === 'verified'
                        ? 'success'
                        : offer.verificationStatus === 'demo'
                          ? 'warning'
                          : offer.verificationStatus === 'expired'
                            ? 'danger'
                            : 'neutral'
                    }
                  >
                    {titleCase(offer.verificationStatus)}
                  </Badge>
                </div>

                <p className="text-sm text-ink">{offer.description}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {offer.code ? (
                    <>
                      <span className="rounded-md border border-dashed border-primary/50 bg-primary-soft px-2.5 py-1 font-mono text-xs font-semibold text-primary-dark">
                        {offer.code}
                      </span>
                      <span className="text-xs text-muted">Use at checkout</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Auto-applied where available</span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
                  <span className="font-semibold text-ink-soft">{offer.providerName ?? 'Provider'}</span>
                  {offer.minimumOrderValue != null ? (
                    <span>Min {formatCurrency(offer.minimumOrderValue)}</span>
                  ) : null}
                  {offer.maximumDiscount != null ? (
                    <span>Up to {formatCurrency(offer.maximumDiscount)}</span>
                  ) : null}
                  {offer.expiresAt ? <span>Expires {formatDate(offer.expiresAt)}</span> : null}
                </div>

                {offer.terms ? <p className="text-xs text-muted">{offer.terms}</p> : null}
              </article>
            ))}
          </div>
          <Pagination
            page={offers.data.meta.page}
            totalPages={offers.data.meta.totalPages}
            total={offers.data.meta.total}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No offers found"
          message="Try showing all offers or a different provider."
        />
      )}
    </div>
  );
}
