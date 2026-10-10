'use client';

import { categoryEmoji } from '@/lib/imagery';

interface FoodCategoryNavProps {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
}

export function FoodCategoryNav({ categories, active, onSelect }: FoodCategoryNavProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
      <CategoryPill
        label="All"
        emoji={categoryEmoji('all')}
        active={active === null}
        onClick={() => onSelect(null)}
      />
      {categories.map((category) => (
        <CategoryPill
          key={category}
          label={category}
          emoji={categoryEmoji(category)}
          active={active === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}

function CategoryPill({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'group flex shrink-0 snap-start items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
        active
          ? 'border-primary bg-primary-soft text-primary-dark'
          : 'border-line bg-surface text-ink hover:border-primary/40 hover:text-primary',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'grid h-8 w-8 place-items-center rounded-full text-base',
          active ? 'bg-primary text-white' : 'bg-surface-alt',
        ].join(' ')}
      >
        {emoji}
      </span>
      {label}
    </button>
  );
}
