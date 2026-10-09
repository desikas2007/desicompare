'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/hooks/useCart';
import { checkoutService } from '@/services/checkout.service';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Field, Input } from '@/components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import type { OrderSummary } from '@/types';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { user, status: authStatus } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const cart = useCart();

  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [addressId, setAddressId] = useState<string>('');
  const [contactName, setContactName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState('');
  const [placedOrder, setPlacedOrder] = useState<OrderSummary | null>(null);

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.listAddresses(),
    enabled: authStatus === 'authenticated',
  });

  const quote = useQuery({
    queryKey: ['checkout-quote', location],
    queryFn: () => checkoutService.quote(location),
    enabled: Boolean(cart.data && cart.data.items.length > 0),
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      orderService.create({
        addressId: addressId || undefined,
        location: location || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
      }),
    onSuccess: (order) => {
      setPlacedOrder(order);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order recorded');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not place order');
    },
  });

  if (cart.isLoading) {
    return (
      <div className="container section stack">
        <Skeleton height={300} radius={18} />
      </div>
    );
  }

  if (!cart.data || cart.data.items.length === 0) {
    if (placedOrder) {
      return <OrderConfirmation order={placedOrder} />;
    }
    return (
      <div className="container section">
        <EmptyState
          title="Nothing to check out"
          message="Add items to your cart first."
          action={
            <Link href="/search">
              <Button>Find food</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (placedOrder) {
    return <OrderConfirmation order={placedOrder} />;
  }

  const data = quote.data;

  return (
    <div className="container section">
      <h1 className="section-title">Checkout</h1>

      {!user ? (
        <div className={styles.notice}>
          You need an account to place an order.{' '}
          <Link href="/auth" style={{ textDecoration: 'underline', fontWeight: 700 }}>
            Sign in or create one
          </Link>
          .
        </div>
      ) : null}

      <div className={styles.layout}>
        <div>
          {user ? (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Delivery address</h2>
              {addresses.isLoading ? (
                <Skeleton height={80} radius={14} />
              ) : addresses.data && addresses.data.length ? (
                <div className={styles.addresses}>
                  {addresses.data.map((address) => (
                    <label
                      key={address.id}
                      className={[styles.addressOption, addressId === address.id ? styles.addressSelected : ''].join(' ')}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={addressId === address.id}
                        onChange={() => setAddressId(address.id)}
                      />
                      <span>
                        <span className={styles.addressName}>
                          {address.label} {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                        </span>
                        <span className={styles.addressLine}>
                          {address.recipientName}, {address.addressLine1}, {address.city} {address.postalCode}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No saved addresses yet. You can add one from your{' '}
                  <Link href="/profile" style={{ textDecoration: 'underline' }}>profile</Link>, or enter a delivery location below.
                </p>
              )}
            </div>
          ) : null}

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Delivery details</h2>
            <div className="stack">
              <Field label="Delivery location" htmlFor="co-location" hint="Used to estimate availability and fees.">
                <Input id="co-location" value={location} onChange={(event) => setLocation(event.target.value)} />
              </Field>
              <div className="grid grid-2">
                <Field label="Contact name" htmlFor="co-name">
                  <Input id="co-name" value={contactName} onChange={(event) => setContactName(event.target.value)} />
                </Field>
                <Field label="Contact phone" htmlFor="co-phone">
                  <Input id="co-phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+919876543210" />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.panelTitle}>Order total</h2>
          {quote.isLoading ? (
            <Skeleton height={160} radius={14} />
          ) : quote.isError ? (
            <ErrorState message="Could not calculate the order total." />
          ) : data ? (
            <>
              {data.providerName ? (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <Badge tone="info">{data.providerName}</Badge>{' '}
                  <DemoBadge isDemo={data.isDemoData} />
                </div>
              ) : null}
              <div className={styles.row}>
                <span>Items ({data.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>{formatCurrency(data.breakdown.itemSubtotal, data.breakdown.currency)}</span>
              </div>
              {data.breakdown.itemDiscount ? (
                <div className={styles.row}>
                  <span>Item discount</span>
                  <span>−{formatCurrency(data.breakdown.itemDiscount, data.breakdown.currency)}</span>
                </div>
              ) : null}
              <div className={styles.row}>
                <span>Delivery fee</span>
                <span>{formatCurrency(data.breakdown.deliveryFee, data.breakdown.currency)}</span>
              </div>
              <div className={styles.row}>
                <span>Platform fee</span>
                <span>{formatCurrency(data.breakdown.platformFee, data.breakdown.currency)}</span>
              </div>
              <div className={styles.row}>
                <span>Packaging</span>
                <span>{formatCurrency(data.breakdown.packagingFee, data.breakdown.currency)}</span>
              </div>
              <div className={styles.row}>
                <span>Taxes</span>
                <span>{formatCurrency(data.breakdown.tax, data.breakdown.currency)}</span>
              </div>
              <div className={`${styles.row} ${styles.total}`}>
                <span>Estimated total</span>
                <span>{formatCurrency(data.breakdown.estimatedTotal, data.breakdown.currency)}</span>
              </div>
              {data.notes.length ? (
                <ul className={styles.notes}>
                  {data.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          <Button
            block
            size="lg"
            style={{ marginTop: 'var(--space-4)' }}
            disabled={!user || !quote.data?.providerId}
            loading={placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            {user ? 'Place order' : 'Sign in to order'}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function OrderConfirmation({ order }: { order: OrderSummary }) {
  const redirected = order.internalStatus === 'redirected';
  return (
    <div className="container section">
      <div className={styles.panel}>
        <div className={styles.success}>
          <h1 className="section-title">
            {redirected ? 'Order created' : 'Order placed successfully'}
          </h1>
          <p className="muted">
            Your reference is <span className={styles.successRef}>{order.internalReference}</span>
          </p>
          <p className="muted" style={{ maxWidth: 520, margin: '0 auto' }}>
            {redirected
              ? 'This provider does not support in-app ordering, so this is a saved cart record — not a confirmed order. Complete your purchase on the provider to finalise it.'
              : 'We will update the status once the provider confirms your order.'}
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--space-5)' }}>
            {redirected && order.officialOrderUrl ? (
              <a href={order.officialOrderUrl} target="_blank" rel="noreferrer noopener">
                <Button>Complete on provider</Button>
              </a>
            ) : null}
            <Link href="/orders">
              <Button variant="secondary">View my orders</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
