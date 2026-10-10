'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { orderService } from '@/services/order.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDateTime, titleCase } from '@/lib/format';
import type { InternalOrderStatus } from '@/types';

function statusTone(status: InternalOrderStatus) {
  switch (status) {
    case 'confirmed':
      return 'success' as const;
    case 'submitted':
    case 'redirected':
      return 'info' as const;
    case 'failed':
    case 'cancelled':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
}

export default function OrdersPage() {
  const { user, status } = useAuth();
  const [page, setPage] = useState(1);

  const orders = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderService.list(page, 10),
    enabled: status === 'authenticated',
  });

  if (status === 'loading') {
    return <Skeleton height={160} radius={16} />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view orders"
        message="Your order history appears here once you sign in."
        action={
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">My orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Records of orders and comparisons you have placed.
        </p>
      </header>

      {orders.isError ? (
        <ErrorState message="Could not load your orders." />
      ) : orders.isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((index) => (
            <Skeleton key={index} height={160} radius={16} />
          ))}
        </div>
      ) : orders.data && orders.data.items.length ? (
        <>
          <div className="flex flex-col gap-4">
            {orders.data.items.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-ink">
                        {order.internalReference}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDateTime(order.createdAt)}
                        {order.restaurantName ? ` · ${order.restaurantName}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(order.internalStatus)}>
                        {titleCase(order.internalStatus)}
                      </Badge>
                      <Badge
                        tone={
                          order.orderConfirmationStatus === 'provider_confirmed' ? 'success' : 'neutral'
                        }
                      >
                        {titleCase(order.orderConfirmationStatus)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col divide-y divide-line border-y border-line">
                    {order.items.map((item) => (
                      <div
                        key={`${item.id}-${item.name}`}
                        className="flex items-center justify-between py-2 text-sm text-ink-soft"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>
                          {formatCurrency(
                            item.unitPrice * item.quantity,
                            order.priceBreakdown.currency,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm font-bold text-ink">
                    <span>Total ({itemCount} items)</span>
                    <span>
                      {formatCurrency(
                        order.priceBreakdown.estimatedTotal,
                        order.priceBreakdown.currency,
                      )}
                    </span>
                  </div>

                  {order.internalStatus === 'redirected' ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                      {order.officialOrderUrl ? (
                        <a href={order.officialOrderUrl} target="_blank" rel="noreferrer noopener">
                          <Button size="sm">Complete on provider</Button>
                        </a>
                      ) : null}
                      <span className="text-xs text-muted">
                        This is a saved record, not a confirmed order.
                      </span>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <Pagination
            page={orders.data.meta.page}
            totalPages={orders.data.meta.totalPages}
            total={orders.data.meta.total}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No orders yet"
          message="When you place an order it will show up here."
          action={
            <Link href="/search">
              <Button>Browse food</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
