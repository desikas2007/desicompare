import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FoodCompare — Compare food delivery prices',
    template: '%s · FoodCompare',
  },
  description:
    'Compare prices, fees, and delivery across food delivery providers before you order. Transparent, provider-agnostic comparison.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AppProviders>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
