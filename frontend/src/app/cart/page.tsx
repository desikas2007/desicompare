'use client';

import Link from 'next/link';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { formatCurrency } from '@/lib/format';
import styles from './cart.module.css';

export default function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  if (cart.isLoading) {
    return (
      <div className="container section stack">
        <Skeleton height={80} radius={14} />
        <Skeleton height={80} radius={14} />
        <Skeleton height={80} radius={14} />
      </div>
    );
  }

  if (cart.isError) {
    return (
      <div className="container section">
        <ErrorState message="Could not load your cart. Please retry." />
      </div>
    );
  }

  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          title="Your cart is empty"
          message="Browse restaurants or search a dish to start a comparison."
          action={
            <Link href="/search">
              <Button>Find food</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container section">
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Your cart</h1>
        <Button variant="ghost" size="sm" loading={clearCart.isPending} onClick={() => clearCart.mutate()}>
          Clear cart
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.items}>
          {data.providerName ? (
            <div className={styles.providerTag}>
              Ordering from <Badge tone="info">{data.providerName}</Badge>
              {data.restaurantName ? <span className="muted">· {data.restaurantName}</span> : null}
            </div>
          ) : null}

          {data.items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemMeta}>
                  {item.portionSize ? `${item.portionSize} · ` : ''}
                  {formatCurrency(item.unitPrice, data.currency)} each
                  {!item.available ? ' · Currently unavailable' : ''}
                </div>
              </div>
              <div className={styles.qty}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  aria-label="Decrease quantity"
                  disabled={updateItem.isPending}
                  onClick={() =>
                    item.quantity <= 1
                      ? removeItem.mutate(item.id)
                      : updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                  }
                >
                  −
                </button>
                <span className={styles.qtyValue}>{item.quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  aria-label="Increase quantity"
                  disabled={updateItem.isPending}
                  onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                >
                  +
                </button>
              </div>
              <div className={styles.itemPrice}>
                {formatCurrency(item.unitPrice * item.quantity, data.currency)}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem.mutate(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>Order summary</h2>
          {!data.providerId ? (
            <p className={styles.notice}>
              You have not selected a provider yet. Fees and final total are shown at checkout.
            </p>
          ) : null}
          <div className={styles.summaryRow}>
            <span>Items ({itemCount})</span>
            <span>{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Fees & taxes</span>
            <span>Calculated at checkout</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Subtotal</span>
            <span>{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          <Link href="/checkout" style={{ display: 'block', marginTop: 'var(--space-4)' }}>
            <Button block size="lg">Go to checkout</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
