'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { restaurantService } from '@/services/restaurant.service';
import { FoodCard } from '@/components/food/FoodCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import type { FoodItemSummary } from '@/types';
import styles from './detail.module.css';

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const restaurant = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantService.get(id),
    enabled: Boolean(id),
  });

  if (restaurant.isError) {
    return (
      <div className="container section">
        <ErrorState
          title="Restaurant not found"
          message="This restaurant may have been removed."
          action={
            <Link href="/restaurants">
              <Button variant="secondary">Back to restaurants</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (restaurant.isLoading || !restaurant.data) {
    return (
      <div className="container section stack">
        <Skeleton height={140} radius={18} />
        <Skeleton height={220} radius={18} />
      </div>
    );
  }

  const data = restaurant.data;
  const grouped = data.menu.reduce<Record<string, FoodItemSummary[]>>((acc, item) => {
    const key = item.category || 'Menu';
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.thumb}>
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={data.displayName} />
            ) : (
              <span aria-hidden>🏬</span>
            )}
          </div>
          <div className={styles.info}>
            <h1 className={styles.title}>{data.displayName}</h1>
            <div className={styles.meta}>
              {data.cuisine.length ? <span>{data.cuisine.join(' · ')}</span> : null}
              {data.rating != null ? <Badge tone="success">★ {data.rating.toFixed(1)}</Badge> : null}
              {data.serviceArea ? <span>{data.serviceArea}</span> : null}
              {data.address ? <span>· {data.address}</span> : null}
            </div>
            <div className={styles.providers}>
              {data.providers.map((provider) => (
                <Link key={provider.id} href={`/search?provider=${provider.slug}`}>
                  <Badge tone="info">{provider.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container section">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className={styles.categoryBlock}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            <div className="grid grid-3">
              {items.map((item) => (
                <FoodCard key={item.id} item={item} quantity={1} />
              ))}
            </div>
          </div>
        ))}
        {data.menu.length === 0 ? (
          <p className="muted">No menu items are available for this restaurant yet.</p>
        ) : null}
      </div>
    </>
  );
}
