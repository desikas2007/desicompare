'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Brand } from '@/components/marketing/Brand';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const authenticated = status === 'authenticated';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(255,255,255,0.85)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-container items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="FoodCompare home" className="flex items-center">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'text-primary' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authenticated ? (
            <Link
              href="/dashboard"
              className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-pill px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="marketing-mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-line bg-surface md:hidden"
          >
            <nav className="mx-auto flex w-full max-w-container flex-col gap-1 px-4 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-3 text-base font-medium text-ink-soft hover:bg-surface-alt hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
                {authenticated ? (
                  <Link
                    href="/dashboard"
                    className="rounded-pill bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Open app
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-pill border border-line px-4 py-3 text-center text-sm font-semibold text-ink"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-pill bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
