'use client';

import { scorePassword } from '@/lib/validation';

const TONE = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = scorePassword(password);
  const active = Math.max(1, score);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-pill ${
              index < active ? TONE[active] : 'bg-line'
            }`}
          />
        ))}
      </div>
      <span className="mt-1 block text-xs text-muted">Password strength: {label}</span>
    </div>
  );
}
