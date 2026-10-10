import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen w-full max-w-container flex-col items-center justify-center px-4 py-20 text-center"
    >
      <p className="text-6xl font-extrabold tracking-tight text-primary sm:text-7xl">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Back to home
      </Link>
    </main>
  );
}
