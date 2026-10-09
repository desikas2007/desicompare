import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
      <p style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>404</p>
      <h1 className="section-title" style={{ marginTop: 'var(--space-3)' }}>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has moved.</p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 'var(--space-4)',
          padding: '0.7rem 1.4rem',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 600,
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
