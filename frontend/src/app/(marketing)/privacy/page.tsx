import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-base font-semibold text-ink">Information we collect</h2>
          <p className="mt-2">
            When you create an account we collect your name, email address, and an optional phone
            number. Passwords are stored only as irreversible Argon2/bcrypt hashes.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">How we use it</h2>
          <p className="mt-2">
            Account details are used to authenticate you, deliver the requested features, and maintain
            your saved addresses, favorites, and order history. We do not sell personal data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Security</h2>
          <p className="mt-2">
            Authentication uses short-lived access tokens with rotating, revoked-on-logout refresh
            sessions stored in HTTP-only cookies. Sensitive server secrets never reach the browser.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            For privacy requests, email <a className="text-primary" href="mailto:hello@foodcompare.local">hello@foodcompare.local</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
