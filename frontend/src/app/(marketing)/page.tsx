import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bookmark,
  Check,
  ListChecks,
  Receipt,
  Search,
  ShoppingBag,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { Hero } from '@/components/marketing/Hero';
import { categoryEmoji, categoryPhoto, categoryTagline } from '@/lib/imagery';

const CATEGORIES = [
  'Biryani',
  'Pizza',
  'Burgers',
  'South Indian',
  'Momos',
  'Noodles',
  'Fried Rice',
  'Desserts',
];

const STEPS = [
  {
    icon: Search,
    title: 'Search a dish',
    body: 'Tell us what you are craving. We match that dish across every provider we support.',
  },
  {
    icon: ListChecks,
    title: 'Compare true totals',
    body: 'Item price, delivery, platform, packaging and taxes — ranked by the final delivered cost.',
  },
  {
    icon: ShoppingBag,
    title: 'Order with confidence',
    body: 'Continue with the cheapest provider, or save the dish to your wishlist for later.',
  },
];

const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Real delivered price',
    body: 'We compare the number that matters — after fees and discounts, not the sticker price.',
  },
  {
    icon: Receipt,
    title: 'Itemised per provider',
    body: 'Every fee line is shown per platform, so you can see exactly where the money goes.',
  },
  {
    icon: Tag,
    title: 'Offers included',
    body: 'Live coupons and discounts from each provider are factored into the comparison.',
  },
  {
    icon: Bookmark,
    title: 'Save dishes to compare later',
    body: 'Bookmark dishes and compare prices again before you place any order.',
  },
];

const FEE_LINES = [
  'Item price',
  'Delivery fee',
  'Platform fee',
  'Packaging',
  'Taxes',
  'Discounts & offers',
];

const DISH_RAIL = [
  'Biryani',
  'Pizza',
  'Burgers',
  'South Indian',
  'Momos',
  'Fried Rice',
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="bg-surface">
        <div className="mx-auto w-full max-w-container px-4 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Popular categories"
            title="Order the classics — compare the price"
            subtitle="Tap a category to see the same dish ranked across every delivery provider by what you actually pay."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-container px-4 py-16 lg:py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to the best delivered price"
            subtitle="Built for the dishes you order on repeat — quick to check, easy to trust."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <step.icon size={22} />
                  </span>
                  <span className="text-4xl font-extrabold leading-none text-primary/15">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto w-full max-w-container px-4 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Transparency"
            title="Why people compare with FoodCompare"
            subtitle="The same dish can cost noticeably more on one platform than another once fees stack up. We make that difference obvious."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-line bg-canvas p-5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <feature.icon size={18} />
                </span>
                <h3 className="mt-3 text-base font-bold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{feature.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 rounded-3xl bg-ink p-8 text-white md:grid-cols-[1fr_1.15fr] md:items-center md:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Every rupee accounted for
              </p>
              <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                No hidden charges. No guesswork.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Each provider&apos;s quote breaks the final delivered cost into the lines that make
                it up — so a low sticker price can never mask a bloated total.
              </p>
            </div>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {FEE_LINES.map((line) => (
                <li key={line} className="flex items-center gap-2.5 text-sm font-medium text-white">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-light/20 text-primary-light">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-container px-4 py-16 lg:py-20">
          <SectionHeading
            eyebrow="On the menu"
            title="Dishes people compare most"
            subtitle="A few of the orders we see compared every day — pick one to check prices."
          />
          <div className="mt-10 -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
            {DISH_RAIL.map((dish) => (
              <DishCard key={dish} dish={dish} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto w-full max-w-container px-4 py-16 lg:py-20">
          <div className="flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center md:flex-row md:justify-between md:px-12 md:text-left">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Ready to see the real savings?
              </h2>
              <p className="mt-1 text-sm text-white/85">
                Create an account to run comparisons, save dishes and track your orders.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-pill border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse dishes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <p className="mt-3 text-base text-ink-soft">{subtitle}</p>
    </div>
  );
}

function CategoryCard({ category }: { category: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(category)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        <Image
          src={categoryPhoto(category)}
          alt={category}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/95 text-lg shadow-sm backdrop-blur">
          {categoryEmoji(category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-base font-bold text-ink">{category}</h3>
        <p className="text-sm text-ink-soft">{categoryTagline(category)}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
          Compare prices
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function DishCard({ dish }: { dish: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(dish)}`}
      className="group w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        <Image
          src={categoryPhoto(dish)}
          alt={dish}
          fill
          sizes="240px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center gap-2.5 p-4">
        <span className="text-xl" aria-hidden>
          {categoryEmoji(dish)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">{dish}</h3>
          <p className="text-xs text-ink-soft">See prices across platforms</p>
        </div>
      </div>
    </Link>
  );
}