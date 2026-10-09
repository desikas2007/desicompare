'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offerService } from '@/services/offer.service';
import { providerService } from '@/services/provider.service';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, titleCase } from '@/lib/format';
import type { OfferSummary } from '@/types';
import styles from './offers.module.css';

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
    <div className="container section">
      <h1 className="section-title">Offers & coupons</h1>
      <p className="section-subtitle">
        Discounts we have recorded across providers. Always verify terms on the provider before ordering.
      </p>

      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Select
            value={providerId}
            onChange={(event) => {
              setProviderId(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
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
      </div>

      {offers.isError ? (
        <ErrorState message="Could not load offers." />
      ) : offers.isLoading ? (
        <div className="grid grid-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height={200} radius={18} />
          ))}
        </div>
      ) : offers.data && offers.data.items.length ? (
        <>
          <div className="grid grid-3">
            {offers.data.items.map((offer) => (
              <Card key={offer.id} hover>
                <CardBody className={styles.offerCard}>
                  <div className={styles.offerTop}>
                    <span className={styles.discount}>{discountLabel(offer)}</span>
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
                  <p style={{ margin: 0 }}>{offer.description}</p>
                  <div className={styles.codeRow}>
                    {offer.code ? (
                      <>
                        <span className={styles.code}>{offer.code}</span>
                        <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>Use at checkout</span>
                      </>
                    ) : (
                      <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>Auto-applied where available</span>
                    )}
                  </div>
                  <div className={styles.meta}>
                    <span>{offer.providerName ?? 'Provider'}</span>
                    {offer.minimumOrderValue != null ? (
                      <span>Min {formatCurrency(offer.minimumOrderValue)}</span>
                    ) : null}
                    {offer.maximumDiscount != null ? (
                      <span>Up to {formatCurrency(offer.maximumDiscount)}</span>
                    ) : null}
                    {offer.expiresAt ? <span>Expires {formatDate(offer.expiresAt)}</span> : null}
                  </div>
                  {offer.terms ? <p className={styles.terms}>{offer.terms}</p> : null}
                </CardBody>
              </Card>
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
        <EmptyState title="No offers found" message="Try showing all offers or a different provider." />
      )}
    </div>
  );
}
