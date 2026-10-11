import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search, ShieldCheck, TrendingDown } from 'lucide-react';
import { Brand } from '@/components/marketing/Brand';
import { foodPhoto } from '@/lib/imagery';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image
          src={foodPhoto('photo-1585937421612-70a008356fbe', 1100)}
          alt="A spread of dishes available for price comparison"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div>
            <Link href="/" aria-label="FoodCompare home" className="inline-flex">
              <Brand inverse />
            </Link>
          </div>
          <div className="max-w-md text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              The best price. One place.
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Every dish. Every platform. The real delivered price.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Item price, delivery, packaging, taxes and discounts — ranked by what you actually
              pay across every provider we support.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm font-medium">
              <li className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                  <Search size={15} />
                </span>
                Search any dish across every provider
              </li>
              <li className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                  <TrendingDown size={15} />
                </span>
                Compare true, all-in delivered totals
              </li>
              <li className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                  <ShieldCheck size={15} />
                </span>
                Order with confidence from the best price
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <main id="main" className="flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 inline-flex lg:hidden" aria-label="FoodCompare home">
          <Brand />
        </Link>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-xs text-muted">
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}