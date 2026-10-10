import Link from 'next/link';
import { Brand } from '@/components/marketing/Brand';

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-container gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] md:items-start lg:px-10">
        <div className="flex flex-col gap-4">
          <Brand />
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Compare food delivery prices across providers before you order. Transparent totals,
            fees included.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-2" aria-label="Footer">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:hello@foodcompare.local"
            className="text-sm text-ink-soft transition-colors hover:text-primary"
          >
            hello@foodcompare.local
          </a>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-container px-4 py-5 text-xs text-muted sm:px-6 lg:px-10">
          © {year} FoodCompare. All rights reserved. Prices shown are estimates until confirmed by the
          provider.
        </div>
      </div>
    </footer>
  );
}
