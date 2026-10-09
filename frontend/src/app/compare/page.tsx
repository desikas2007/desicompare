import { Suspense } from 'react';
import { CompareView } from '@/components/comparison/CompareView';
import { Skeleton } from '@/components/ui/Feedback';

export const metadata = { title: 'Compare prices' };

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container section">
          <Skeleton height={320} radius={18} />
        </div>
      }
    >
      <CompareView />
    </Suspense>
  );
}
