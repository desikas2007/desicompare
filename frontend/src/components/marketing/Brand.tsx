import { UtensilsCrossed } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-white shadow-sm">
        <UtensilsCrossed size={18} />
      </span>
      {!compact ? (
        <span className="text-lg font-bold tracking-tight text-ink">
          Food<span className="text-primary">Compare</span>
        </span>
      ) : null}
    </span>
  );
}
