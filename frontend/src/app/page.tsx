'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/search/SearchBar';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { providerService } from '@/services/provider.service';
import { restaurantService } from '@/services/restaurant.service';
import { formatCurrency } from '@/lib/format';
import styles from './home.module.css';

export default function HomePage() {
  const providers = useQuery({ queryKey: ['providers'], queryFn: () => providerService.list() });
  const restaurants = useQuery({
    queryKey: ['restaurants', 'home'],
    queryFn: () => restaurantService.list({ limit: 6 }),
  });

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div>
            <span className={styles.eyebrow}>Provider-agnostic price comparison</span>
            <h1 className={styles.heroTitle}>
              Stop guessing. <span className={styles.heroAccent}>Compare</span> food delivery prices.
            </h1>
            <p className={styles.heroLead}>
              One search shows the true delivered cost — fees, taxes, and discounts included —
              across every provider we support. See the cheapest option before you order.
            </p>
            <SearchBar autoNavigate autoFocus placeholder="Try “chicken biryani” or “pizza”…" />
            <div className={styles.heroStats}>
              <div>
                <div className={styles.statValue}>
                  {providers.data?.length ?? '—'}
                </div>
                <div className={styles.statLabel}>providers tracked</div>
              </div>
              <div>
                <div className={styles.statValue}>
                  {restaurants.data?.meta.total ?? '—'}
                </div>
                <div className={styles.statLabel}>restaurants</div>
              </div>
              <div>
                <div className={styles.statValue}>Fees incl.</div>
                <div className={styles.statLabel}>true delivered total</div>
              </div>
            </div>
          </div>

          <div className={styles.heroCard}>
            <div className={styles.heroCardTitle}>Example: 1× Chicken Biryani</div>
            <div className={styles.heroQuoteRow}>
              <span>Eatsure</span>
              <span className={styles.heroQuoteBest}>{formatCurrency(289.4)}</span>
            </div>
            <div className={styles.heroQuoteRow}>
              <span>Swiggy</span>
              <span>{formatCurrency(322.1)}</span>
            </div>
            <div className={styles.heroQuoteRow}>
              <span>Zomato</span>
              <span>{formatCurrency(334.7)}</span>
            </div>
            <p className="muted" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)', marginBottom: 0 }}>
              Illustration only. Live and demo quotes are clearly labelled per provider.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">Three steps to the best delivered price.</p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <h3>Search a dish</h3>
              <p className="muted">We match your query to the same dish across providers.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <h3>Compare totals</h3>
              <p className="muted">Item price, delivery, platform, packaging and taxes — all in.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <h3>Order the best</h3>
              <p className="muted">Jump to the cheapest provider, or save it to your cart.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">Tracked providers</h2>
          <p className="section-subtitle">Integration status is shown transparently.</p>
          <div className={styles.providerRow}>
            {providers.isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} height={40} width={160} radius={999} />)
              : (providers.data ?? []).map((provider) => (
                  <span key={provider.id} className={styles.providerChip}>
                    <span className={styles.providerDot} />
                    {provider.name}
                    <Badge tone={provider.integrationMode === 'demo' ? 'warning' : 'neutral'}>
                      {provider.integrationMode}
                    </Badge>
                  </span>
                ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Featured restaurants</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Popular spots in the demo dataset.</p>
            </div>
            <Link href="/restaurants">
              <Button variant="secondary" size="sm">View all</Button>
            </Link>
          </div>

          {restaurants.isError ? (
            <ErrorState message="Could not load restaurants. Is the API running?" />
          ) : restaurants.isLoading ? (
            <div className="grid grid-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={120} radius={18} />)}
            </div>
          ) : restaurants.data && restaurants.data.items.length ? (
            <div className="grid grid-3">
              {restaurants.data.items.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No restaurants yet"
              message="Seed the database to load demo restaurants."
              action={<Link href="/search"><Button>Search all food</Button></Link>}
            />
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className={styles.cta}>
            <div>
              <h3 className={styles.ctaTitle}>Ready to see the real savings?</h3>
              <p className={styles.ctaText}>Run a live comparison in seconds — no sign-up required.</p>
            </div>
            <Link href="/compare">
              <Button size="lg">Compare prices now</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
