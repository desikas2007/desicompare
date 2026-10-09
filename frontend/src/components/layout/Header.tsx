'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCartCount } from '@/hooks/useCart';
import styles from './header.module.css';

const NAV = [
  { href: '/search', label: 'Search' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/offers', label: 'Offers' },
  { href: '/compare', label: 'Compare' },
];

export function Header() {
  const pathname = usePathname();
  const { user, status, logout, isAdmin } = useAuth();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="FoodCompare home">
          <span className={styles.brandMark}>FC</span>
          <span className={styles.brandName}>
            Food<span className={styles.brandAccent}>Compare</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[styles.navLink, active ? styles.navLinkActive : ''].filter(Boolean).join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartLink} aria-label={`Cart, ${cartCount} items`}>
            <span aria-hidden>🛒</span>
            <span className={styles.cartLabel}>Cart</span>
            {cartCount > 0 ? <span className={styles.cartCount}>{cartCount}</span> : null}
          </Link>

          {status === 'loading' ? (
            <span className={styles.authPlaceholder} aria-hidden />
          ) : user ? (
            <div className={styles.menu}>
              <button
                type="button"
                className={styles.userButton}
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                <span className={styles.avatar}>{user.name.slice(0, 1).toUpperCase()}</span>
                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen ? (
                <div className={styles.dropdown} onMouseLeave={() => setMenuOpen(false)}>
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    My profile
                  </Link>
                  <Link href="/orders" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    My orders
                  </Link>
                  {isAdmin ? (
                    <Link href="/admin" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      Admin
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/auth" className={styles.signIn}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
