/**
 * Text normalization used for product/restaurant matching and de-duplication.
 * Deterministic and dependency-free so it can run in seed scripts and at runtime.
 */
export function normalizeName(input: string): string {
  return (input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeName(input);
  return normalized.length > 0 ? normalized.split(' ').filter(Boolean) : [];
}

const DIETARY_HINTS: Record<string, 'veg' | 'non_veg' | 'vegan'> = {
  chicken: 'non_veg',
  mutton: 'non_veg',
  egg: 'non_veg',
  fish: 'non_veg',
  prawn: 'non_veg',
  paneer: 'veg',
};

export function inferDietaryType(name: string): 'veg' | 'non_veg' | 'vegan' | 'unknown' {
  const tokens = tokenize(name);
  for (const token of tokens) {
    const hint = DIETARY_HINTS[token];
    if (hint) return hint;
  }
  return 'unknown';
}
