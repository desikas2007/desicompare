'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';

export default function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  if (cart.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-line bg-surface-alt" />
        ))}
      </div>
    );
  }

  if (cart.isError) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft px-6 py-12 text-center text-sm text-danger">
        Could not load your cart. Please retry.
      </div>
    );
  }

  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <ShoppingBag size={24} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Browse restaurants or search a dish to start a comparison.
        </p>
        <Link
          href="/search"
          className="mt-5 inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Find food
        </Link>
      </div>
    );
  }

  const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Your cart</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {itemCount} item{itemCount === 1 ? '' : 's'} ready for checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
          className="rounded-pill border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-danger hover:text-danger disabled:opacity-60"
        >
          Clear cart
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          {data.providerName ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              Ordering from <Badge tone="info">{data.providerName}</Badge>
              {data.restaurantName ? <span className="text-muted">· {data.restaurantName}</span> : null}
            </div>
          ) : null}

          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {item.portionSize ? `${item.portionSize} · ` : ''}
                    {formatCurrency(item.unitPrice, data.currency)} each
                    {!item.available ? ' · Currently unavailable' : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="inline-flex items-center rounded-pill border border-line bg-surface">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={updateItem.isPending}
                      onClick={() =>
                        item.quantity <= 1
                          ? removeItem.mutate(item.id)
                          : updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                      }
                      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:text-ink disabled:opacity-50"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:text-ink disabled:opacity-50"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <span className="min-w-[5rem] text-right text-sm font-semibold text-ink">
                    {formatCurrency(item.unitPrice * item.quantity, data.currency)}
                  </span>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem.mutate(item.id)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Order summary</h2>
            {!data.providerId ? (
              <p className="mt-2 rounded-xl bg-surface-alt px-3 py-2 text-xs text-ink-soft">
                You have not selected a provider yet. Fees and the final total are shown at checkout.
              </p>
            ) : null}
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between text-ink-soft">
                <dt>Items ({itemCount})</dt>
                <dd>{formatCurrency(data.subtotal, data.currency)}</dd>
              </div>
              <div className="flex items-center justify-between text-ink-soft">
                <dt>Fees &amp; taxes</dt>
                <dd className="text-muted">Calculated at checkout</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-ink">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(data.subtotal, data.currency)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-5 flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Go to checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
