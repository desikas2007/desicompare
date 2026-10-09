'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './searchbar.module.css';

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Search for a dish, restaurant, or cuisine…',
  autoNavigate = false,
  autoFocus = false,
}: {
  initialValue?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
  autoNavigate?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (onSearch) onSearch(trimmed);
    if (autoNavigate) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className={styles.form} onSubmit={submit} role="search">
      <span className={styles.icon} aria-hidden>🔎</span>
      <input
        className={styles.input}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search food or restaurants"
      />
      <Button type="submit" size="sm">Search</Button>
    </form>
  );
}
