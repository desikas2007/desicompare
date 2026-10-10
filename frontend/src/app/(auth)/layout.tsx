import Link from 'next/link';
import { Brand } from '@/components/marketing/Brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50% 45% at 50% 0%, rgba(240,86,45,0.10) 0%, transparent 70%)',
        }}
      />
      <Link href="/" className="mb-8" aria-label="FoodCompare home">
        <Brand />
      </Link>
      <main id="main" className="w-full max-w-md">
        {children}
      </main>
      <p className="mt-8 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-primary">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
