'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  UtensilsCrossed,
  ChefHat,
  ArrowLeftRight,
  Tag,
  Heart,
  ShoppingCart,
  Receipt,
  User as UserIcon,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCartCount } from '@/hooks/useCart';
import { RequireAuth } from '@/components/app/RequireAuth';
import { Brand } from '@/components/marketing/Brand';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Discover', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/dishes', label: 'Dishes', icon: ChefHat },
  { href: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight },
  { href: '/offers', label: 'Offers', icon: Tag },
  { href: '/saved', label: 'Saved', icon: Heart },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace('/');
  }

  const initial = user?.name?.slice(0, 1).toUpperCase() ?? '?';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-pill border border-line bg-surface py-1 pl-1 pr-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-alt"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{user?.name}</span>
        <ChevronDown size={15} className="text-muted" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-lg"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <UserIcon size={15} /> My profile
              </span>
            </Link>
            <Link
              href="/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <Receipt size={15} /> My orders
              </span>
            </Link>
            <Link
              href="/saved"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <Heart size={15} /> Saved items
              </span>
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <>
      {NAV.filter((item) => !item.adminOnly || isAdmin).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex items-center gap-2 rounded-pill px-3.5 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary-soft text-primary-dark'
                : 'text-ink-soft hover:bg-surface-alt hover:text-ink',
            ].join(' ')}
          >
            <item.icon size={16} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-container items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/dashboard" aria-label="FoodCompare home" className="shrink-0">
            <Brand />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Application">
            <NavLinks />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <div className="hidden sm:block">
              <ProfileMenu />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden border-t border-line bg-surface lg:hidden"
            >
              <nav className="mx-auto flex w-full max-w-container flex-col gap-1 px-4 py-3 sm:px-6 lg:px-10" aria-label="Application mobile">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
                <div className="mt-2 border-t border-line pt-3 sm:hidden">
                  <ProfileMenu />
                </div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main id="main" className="flex-1">
        <div
          className="mx-auto w-full max-w-container px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
          key={pathname}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  );
}
