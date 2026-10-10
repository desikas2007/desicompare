'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Form';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean };

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { invalid, style, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative block">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        invalid={invalid}
        style={{ paddingRight: '2.75rem', ...style }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
});
