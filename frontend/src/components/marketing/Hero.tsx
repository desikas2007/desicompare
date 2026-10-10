'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { AnimatedText } from '@/components/marketing/AnimatedText';
import { HERO_PHOTOS } from '@/lib/imagery';

const COLLAGE = [
  { src: HERO_PHOTOS[0], className: 'aspect-[4/5]' },
  { src: HERO_PHOTOS[1], className: 'aspect-square' },
  { src: HERO_PHOTOS[2], className: 'aspect-square' },
  { src: HERO_PHOTOS[3], className: 'aspect-[4/5]' },
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const primaryHref = user ? '/search' : '/register';
  const primaryLabel = user ? 'Compare prices now' : 'Start comparing';

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: 'easeOut' as const },
        };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(55% 50% at 20% 0%, rgba(232,71,43,0.12) 0%, rgba(232,71,43,0.03) 42%, transparent 72%)',
        }}
      />
      <div className="mx-auto grid w-full max-w-container gap-12 px-4 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-24">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.span
            {...fade(0)}
            className="mb-6 inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft"
          >
            <Sparkles size={14} className="text-primary" />
            Provider-agnostic price comparison
          </motion.span>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
            <AnimatedText text="Every dish. Every platform. The real delivered price." delay={0.1} />
          </h1>

          <motion.p
            {...fade(0.5)}
            className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg"
          >
            Search once and see the true delivered cost — item price, fees and discounts included —
            across every provider we support, ranked by what you actually pay.
          </motion.p>

          <motion.div {...fade(0.7)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-dark"
            >
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-pill border border-line bg-surface px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
            >
              Browse dishes
            </Link>
          </motion.div>

          <motion.div
            {...fade(0.9)}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted lg:justify-start"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-primary" /> Secure authentication
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingDown size={15} className="text-primary" /> Fees and discounts included
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Demo data clearly labelled
            </span>
          </motion.div>
        </div>

        <motion.div
          {...fade(0.35)}
          className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:max-w-none"
        >
          <div className="flex flex-col gap-4">
            {COLLAGE[0].src ? (
              <CollageImage src={COLLAGE[0].src} className={COLLAGE[0].className} priority />
            ) : null}
            {COLLAGE[2].src ? <CollageImage src={COLLAGE[2].src} className={COLLAGE[2].className} /> : null}
          </div>
          <div className="flex flex-col gap-4 pt-8">
            {COLLAGE[1].src ? <CollageImage src={COLLAGE[1].src} className={COLLAGE[1].className} /> : null}
            {COLLAGE[3].src ? <CollageImage src={COLLAGE[3].src} className={COLLAGE[3].className} /> : null}
          </div>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-md backdrop-blur">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success">
              <TrendingDown size={16} />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Same order
              </p>
              <p className="text-sm font-bold text-ink">Save up to 30% by comparing</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CollageImage({
  src,
  className,
  priority,
}: {
  src: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={['relative overflow-hidden rounded-3xl bg-surface-alt shadow-md', className].join(' ')}>
      <Image
        src={src}
        alt="Popular dishes available for price comparison"
        fill
        priority={priority}
        sizes="(max-width: 1024px) 45vw, 260px"
        className="object-cover"
      />
    </div>
  );
}
