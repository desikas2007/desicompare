import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RestaurantSummary } from '@/types';
import styles from './food.module.css';

export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card hover>
        <div className={styles.restaurantCard}>
          <div className={styles.restaurantMedia}>
            {restaurant.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.imageUrl} alt={restaurant.displayName} loading="lazy" />
            ) : (
              <span aria-hidden>🏬</span>
            )}
          </div>
          <div className={styles.restaurantBody}>
            <p className={styles.title}>{restaurant.displayName}</p>
            <span className={styles.cuisine}>
              {restaurant.cuisine.length ? restaurant.cuisine.join(' · ') : 'Multiple cuisines'}
            </span>
            <div className={styles.providerChips}>
              {restaurant.rating != null ? (
                <span className={styles.ratingPill}>★ {restaurant.rating.toFixed(1)}</span>
              ) : null}
              {restaurant.serviceArea ? <Badge>{restaurant.serviceArea}</Badge> : null}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
