'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/hooks/useCart';
import { checkoutService } from '@/services/checkout.service';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Field, Input } from '@/components/ui/Form';
import { ApiError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import type { OrderSummary } from '@/types';

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
    return <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface-alt" />;
  }

  if (!cart.data || cart.data.items.length === 0) {
    if (placedOrder) return <OrderConfirmation order={placedOrder} />;
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Nothing to check out</h1>
        <p className="mt-1 text-sm text-ink-soft">Add items to your cart first.</p>
        <Link
          href="/search"
          className="mt-5 inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Find food
        </Link>
      </div>
    );
  }

  if (placedOrder) return <OrderConfirmation order={placedOrder} />;

  const data = quote.data;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Confirm your delivery details and review the final total.
        </p>
      </header>

      {!user ? (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          You need an account to place an order.{' '}
          <Link href="/login" className="font-semibold underline">
            Sign in or create one
          </Link>
          .
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {user ? (
            <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-lg font-bold text-ink">
                <MapPin className="h-4 w-4 text-muted" /> Delivery address
              </h2>
              <div className="mt-4">
                {addresses.isLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-surface-alt" />
                ) : addresses.data && addresses.data.length ? (
                  <div className="grid gap-3">
                    {addresses.data.map((address) => {
                      const selected = addressId === address.id;
                      return (
                        <label
                          key={address.id}
                          className={[
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                            selected
                              ? 'border-primary bg-primary-soft'
                              : 'border-line bg-surface hover:border-primary/40',
                          ].join(' ')}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selected}
                            onChange={() => setAddressId(address.id)}
                            className="mt-1 accent-primary"
                          />
                          <span>
                            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                              {address.label}
                              {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-soft">
                              {address.recipientName}, {address.addressLine1}, {address.city}{' '}
                              {address.postalCode}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">
                    No saved addresses yet. You can add one from your{' '}
                    <Link href="/profile" className="font-semibold text-primary hover:text-primary-dark">
                      profile
                    </Link>
                    , or enter a delivery location below.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Delivery details</h2>
            <div className="mt-4 flex flex-col gap-4">
              <Field
                label="Delivery location"
                htmlFor="co-location"
                hint="Used to estimate availability and fees."
              >
                <Input
                  id="co-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact name" htmlFor="co-name">
                  <Input
                    id="co-name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                  />
                </Field>
                <Field label="Contact phone" htmlFor="co-phone">
                  <Input
                    id="co-phone"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="+919876543210"
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Order total</h2>
            {quote.isLoading ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-surface-alt" />
            ) : quote.isError ? (
              <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                Could not calculate the order total.
              </p>
            ) : data ? (
              <>
                {data.providerName ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone="info">{data.providerName}</Badge>
                    <DemoBadge isDemo={data.isDemoData} />
                  </div>
                ) : null}
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  <SummaryRow
                    label={`Items (${data.items.reduce((sum, item) => sum + item.quantity, 0)})`}
                    value={formatCurrency(data.breakdown.itemSubtotal, data.breakdown.currency)}
                  />
                  {data.breakdown.itemDiscount ? (
                    <SummaryRow
                      label="Item discount"
                      value={`−${formatCurrency(data.breakdown.itemDiscount, data.breakdown.currency)}`}
                    />
                  ) : null}
                  <SummaryRow
                    label="Delivery fee"
                    value={formatCurrency(data.breakdown.deliveryFee, data.breakdown.currency)}
                  />
                  <SummaryRow
                    label="Platform fee"
                    value={formatCurrency(data.breakdown.platformFee, data.breakdown.currency)}
                  />
                  <SummaryRow
                    label="Packaging"
                    value={formatCurrency(data.breakdown.packagingFee, data.breakdown.currency)}
                  />
                  <SummaryRow
                    label="Taxes"
                    value={formatCurrency(data.breakdown.tax, data.breakdown.currency)}
                  />
                  <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-ink">
                    <dt>Estimated total</dt>
                    <dd>{formatCurrency(data.breakdown.estimatedTotal, data.breakdown.currency)}</dd>
                  </div>
                </dl>
                {data.notes.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted">
                    {data.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : null}

            <button
              type="button"
              disabled={!user || !quote.data?.providerId || placeOrder.isPending}
              onClick={() => placeOrder.mutate()}
              className="mt-5 flex w-full items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placeOrder.isPending ? 'Placing order…' : user ? 'Place order' : 'Sign in to order'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function OrderConfirmation({ order }: { order: OrderSummary }) {
  const redirected = order.internalStatus === 'redirected';
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 size={28} />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        {redirected ? 'Order created' : 'Order placed successfully'}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Your reference is{' '}
        <span className="rounded-md bg-surface-alt px-2 py-1 font-mono text-sm font-semibold text-ink">
          {order.internalReference}
        </span>
      </p>
      <p className="mt-3 max-w-md text-sm text-ink-soft">
        {redirected
          ? 'This provider does not support in-app ordering, so this is a saved cart record — not a confirmed order. Complete your purchase on the provider to finalise it.'
          : 'We will update the status once the provider confirms your order.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {redirected && order.officialOrderUrl ? (
          <a
            href={order.officialOrderUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Complete on provider
          </a>
        ) : null}
        <Link
          href="/orders"
          className="inline-flex rounded-pill border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-alt"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
