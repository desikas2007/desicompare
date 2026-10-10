import { Suspense } from 'react';
import { SearchView } from '@/components/search/SearchView';
import { Skeleton } from '@/components/ui/Feedback';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container section">
          <Skeleton height={48} width={320} />
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
