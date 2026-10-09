import { ReactNode } from 'react';
import styles from './ui.module.css';

type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const toneClass = {
    primary: styles.badgePrimary,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    danger: styles.badgeDanger,
    neutral: styles.badgeNeutral,
    info: styles.badgeInfo,
  }[tone];

  return (
    <span className={[styles.badge, toneClass, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export function DietBadge({ dietaryType }: { dietaryType: string }) {
  const map: Record<string, { label: string; tone: BadgeTone }> = {
    veg: { label: 'Veg', tone: 'success' },
    vegan: { label: 'Vegan', tone: 'success' },
    non_veg: { label: 'Non-veg', tone: 'danger' },
    unknown: { label: 'Unspecified', tone: 'neutral' },
  };
  const item = map[dietaryType] ?? map.unknown;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function DemoBadge({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null;
  return <Badge tone="warning">Demo data</Badge>;
}
