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
      <ErrorState
        title="Restaurant not found"
        message="This restaurant may have been removed."
        action={
          <Link href="/restaurants">
            <Button variant="secondary">Back to restaurants</Button>
          </Link>
        }
      />
    );
  }

  if (restaurant.isLoading || !restaurant.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton height={160} radius={20} />
        <Skeleton height={220} radius={16} />
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
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-primary-soft to-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-surface text-4xl shadow-sm">
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={data.displayName} className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>🏬</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {data.displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
              {data.cuisine.length ? <span>{data.cuisine.join(' · ')}</span> : null}
              {data.rating != null ? <Badge tone="success">★ {data.rating.toFixed(1)}</Badge> : null}
              {data.serviceArea ? <span>{data.serviceArea}</span> : null}
              {data.address ? <span className="text-muted">· {data.address}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.providers.map((provider) => (
                <Link key={provider.id} href={`/search?provider=${provider.slug}`}>
                  <Badge tone="info">{provider.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <FoodCard key={item.id} item={item} quantity={1} />
              ))}
            </div>
          </section>
        ))}
        {data.menu.length === 0 ? (
          <p className="text-sm text-muted">No menu items are available for this restaurant yet.</p>
        ) : null}
      </div>
    </div>
  );
}
