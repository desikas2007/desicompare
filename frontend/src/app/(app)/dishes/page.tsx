import { Suspense } from 'react';
import { DishesView } from '@/components/food/DishesView';
import { Skeleton } from '@/components/ui/Feedback';

export default function DishesPage() {
  return (
    <Suspense
      fallback={
        <div className="container section">
          <Skeleton height={48} width={320} />
        </div>
      }
    >
      <DishesView />
    </Suspense>
  );
}
