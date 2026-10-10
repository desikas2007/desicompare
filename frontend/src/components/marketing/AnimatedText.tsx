'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ElementType } from 'react';

interface AnimatedTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay (seconds) before the first word starts animating. */
  delay?: number;
  /** Per-word stagger (seconds). */
  stagger?: number;
}

/**
 * Word-by-word staggered entrance animation for headlines.
 *
 * - Uses a transform + opacity only (no layout-affecting properties), so it
 *   never causes layout shift: each word reserves its final box immediately.
 * - Honours `prefers-reduced-motion` by rendering the text statically.
 */
export function AnimatedText({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.06,
}: AnimatedTextProps) {
  const reduceMotion = useReducedMotion();
  const words = text.split(' ');

  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const word: Variants = {
    hidden: { opacity: 0, y: '0.5em' },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
  };

  return (
    <Tag className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        animate="visible"
        style={{ display: 'inline' }}
        aria-label={text}
      >
        {words.map((item, index) => (
          <motion.span
            key={`${item}-${index}`}
            variants={word}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
            aria-hidden="true"
          >
            {item}
            {index < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
