import { inferDietaryType, normalizeName, tokenize } from './normalize';

describe('normalize utilities', () => {
  it('normalizes names deterministically', () => {
    expect(normalizeName('  Chicken   Biryani!! ')).toBe('chicken biryani');
    expect(normalizeName("Domino's Pizza")).toBe('domino s pizza');
  });

  it('tokenizes and drops empty tokens', () => {
    expect(tokenize('Masala   Dosa')).toEqual(['masala', 'dosa']);
    expect(tokenize('   ')).toEqual([]);
  });

  it('infers dietary type from keywords', () => {
    expect(inferDietaryType('Chicken Biryani')).toBe('non_veg');
    expect(inferDietaryType('Paneer Butter Masala')).toBe('veg');
    expect(inferDietaryType('Mystery Dish')).toBe('unknown');
  });
});
