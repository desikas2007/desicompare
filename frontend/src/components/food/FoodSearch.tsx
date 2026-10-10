'use client';

import { FormEvent } from 'react';
import { Search } from 'lucide-react';

interface FoodSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function FoodSearch({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search for a dish — biryani, pizza, dosa…',
  autoFocus = false,
}: FoodSearchProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 shadow-sm focus-within:border-primary"
    >
      <Search className="h-5 w-5 shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search dishes"
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted focus:outline-none sm:text-base"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
}
