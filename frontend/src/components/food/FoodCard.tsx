'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge, DietBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { useAddToCart } from '@/hooks/useCart';
import type { FoodItemSummary, SearchFoodItem } from '@/types';
import styles from './food.module.css';

type Item = FoodItemSummary | SearchFoodItem;

function hasMinPrice(item: Item): item is SearchFoodItem {
  return 'minPrice' in item;
}

export function FoodCard({
  item,
  showCompare = true,
  quantity = 1,
}: {
  item: Item;
  showCompare?: boolean;
  quantity?: number;
}) {
  const addToCart = useAddToCart();
  const minPrice = hasMinPrice(item) ? item.minPrice : null;
  const providerCount = hasMinPrice(item) ? item.providerCount : 0;

  return (
    <Card hover className={styles.card}>
      <div className={styles.media}>
        <div className={styles.mediaBadges}>
          <DietBadge dietaryType={item.dietaryType} />
        </div>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.displayName} loading="lazy" />
        ) : (
          <span aria-hidden>🍽️</span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{item.displayName}</p>
        <p className={styles.subtitle}>
          {item.category}
          {item.portionSize ? ` · ${item.portionSize}` : ''}
        </p>
        <div className={styles.metaRow}>
          {minPrice != null ? (
            <span className={styles.price}>
              <span className={styles.priceFrom}>
                from · {providerCount} provider{providerCount === 1 ? '' : 's'}
              </span>
              {formatCurrency(minPrice)}
            </span>
          ) : (
            <span className={styles.subtitle}>Price varies by provider</span>
          )}
          {providerCount > 1 ? <Badge tone="info">{providerCount} offers</Badge> : null}
        </div>
        <div className={styles.actions}>
          <Button
            size="sm"
            loading={addToCart.isPending}
            onClick={() => addToCart.mutate({ foodItemId: item.id, quantity })}
          >
            Add to cart
          </Button>
          {showCompare ? (
            <Link
              href={`/compare?q=${encodeURIComponent(item.displayName)}`}
              style={{ flex: 1 }}
            >
              <Button variant="secondary" size="sm" block>
                Compare
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
