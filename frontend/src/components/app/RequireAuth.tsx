'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/Feedback';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-live="polite">
      <Spinner />
      <span className="sr-only">Loading your session…</span>
    </div>
  );
}

/**
 * Client-side gate for the private application. This is a UX convenience only —
 * every protected API call is still authorized server-side.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      const next = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
