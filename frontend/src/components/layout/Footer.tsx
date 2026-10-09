import Link from 'next/link';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandCol}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>FC</span>
            <span className={styles.brandName}>
              Food<span className={styles.brandAccent}>Compare</span>
            </span>
          </div>
          <p className={styles.tagline}>
            Compare food delivery prices across providers before you order. Built as a
            transparent, provider-agnostic comparison layer.
          </p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Discover</h4>
          <Link href="/search" className={styles.link}>Search food</Link>
          <Link href="/restaurants" className={styles.link}>Restaurants</Link>
          <Link href="/offers" className={styles.link}>Offers</Link>
          <Link href="/compare" className={styles.link}>Compare prices</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Account</h4>
          <Link href="/auth" className={styles.link}>Sign in</Link>
          <Link href="/orders" className={styles.link}>Orders</Link>
          <Link href="/profile" className={styles.link}>Profile</Link>
          <Link href="/cart" className={styles.link}>Cart</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>About</h4>
          <span className={styles.note}>
            Prices shown from demo providers are clearly labelled and are not live
            marketplace quotes.
          </span>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className="container">
          <span>© {new Date().getFullYear()} FoodCompare. Demo project.</span>
        </div>
      </div>
    </footer>
  );
}
