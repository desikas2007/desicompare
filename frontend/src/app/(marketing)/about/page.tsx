import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">About FoodCompare</h1>
      <p className="mt-6 text-base leading-relaxed text-ink-soft">
        FoodCompare is a provider-agnostic food delivery price comparison platform. Search for a dish
        once and see its true delivered cost — item price, delivery fee, platform fee, packaging,
        taxes, and discounts — across every supported provider, ranked by the final total.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        We are honest about data sources. No live marketplace price is ever fabricated. Providers run
        in <strong>demo</strong> mode (deterministic, clearly labelled sample data) or <strong>live</strong>{' '}
        mode when an authorized integration is configured, and the interface always labels demo quotes
        explicitly.
      </p>
      <div className="mt-10 flex gap-3">
        <Link
          href="/register"
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Get started
        </Link>
        <Link
          href="/contact"
          className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
