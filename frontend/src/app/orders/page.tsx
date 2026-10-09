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
import styles from './orders.module.css';

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
    return (
      <div className="container section stack">
        <Skeleton height={120} radius={18} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container section">
        <EmptyState
          title="Sign in to view orders"
          message="Your order history appears here once you sign in."
          action={
            <Link href="/auth">
              <Button>Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">My orders</h1>
      <p className="section-subtitle">Records of orders and comparisons you have placed.</p>

      {orders.isError ? (
        <ErrorState message="Could not load your orders." />
      ) : orders.isLoading ? (
        <div className="stack">
          {[0, 1].map((index) => (
            <Skeleton key={index} height={160} radius={18} />
          ))}
        </div>
      ) : orders.data && orders.data.items.length ? (
        <>
          {orders.data.items.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <div key={order.id} className={styles.order}>
                <div className={styles.orderHead}>
                  <div>
                    <div className={styles.ref}>{order.internalReference}</div>
                    <div className={styles.orderMeta}>
                      {formatDateTime(order.createdAt)}
                      {order.restaurantName ? ` · ${order.restaurantName}` : ''}
                    </div>
                  </div>
                  <div className="row">
                    <Badge tone={statusTone(order.internalStatus)}>{titleCase(order.internalStatus)}</Badge>
                    <Badge tone={order.orderConfirmationStatus === 'provider_confirmed' ? 'success' : 'neutral'}>
                      {titleCase(order.orderConfirmationStatus)}
                    </Badge>
                  </div>
                </div>

                <div className={styles.items}>
                  {order.items.map((item) => (
                    <div key={`${item.id}-${item.name}`} className={styles.itemLine}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice * item.quantity, order.priceBreakdown.currency)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.totalRow}>
                  <span>Total ({itemCount} items)</span>
                  <span>{formatCurrency(order.priceBreakdown.estimatedTotal, order.priceBreakdown.currency)}</span>
                </div>

                {order.internalStatus === 'redirected' ? (
                  <div className={styles.actions}>
                    {order.officialOrderUrl ? (
                      <a href={order.officialOrderUrl} target="_blank" rel="noreferrer noopener">
                        <Button size="sm">Complete on provider</Button>
                      </a>
                    ) : null}
                    <span className={styles.orderMeta}>
                      This is a saved record, not a confirmed order.
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
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
