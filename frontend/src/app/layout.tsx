import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'FoodCompare — Compare food delivery prices',
    template: '%s · FoodCompare',
  },
  description:
    'Compare prices, fees, and delivery across food delivery providers before you order. Transparent, provider-agnostic comparison.',
  metadataBase: new URL('https://foodcompare.local'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
