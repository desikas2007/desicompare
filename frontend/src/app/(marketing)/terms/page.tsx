import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-base font-semibold text-ink">Use of the service</h2>
          <p className="mt-2">
            FoodCompare provides price comparison information. You agree to use the service lawfully
            and not to attempt to disrupt, overload, or gain unauthorized access to any system.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Data accuracy</h2>
          <p className="mt-2">
            Quotes marked as demo are illustrative sample data and are labelled accordingly. Final
            prices are determined by the provider at checkout.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Accounts</h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your credentials and for all
            activity under your account.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{' '}
            <a className="text-primary" href="mailto:hello@foodcompare.local">hello@foodcompare.local</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
