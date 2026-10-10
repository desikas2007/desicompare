import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Contact</h1>
      <p className="mt-6 text-base leading-relaxed text-ink-soft">
        Questions, feedback, or provider integration requests? We would like to hear from you.
      </p>
      <a
        href="mailto:hello@foodcompare.local"
        className="mt-8 inline-flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-ink shadow-sm transition-colors hover:border-primary"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Mail size={18} />
        </span>
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Email</span>
          <span className="block text-sm font-medium">hello@foodcompare.local</span>
        </span>
      </a>
    </div>
  );
}
