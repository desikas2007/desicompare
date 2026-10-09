import { formatCurrency, formatMinutes, formatDate, titleCase, truncate } from './format';

describe('formatCurrency', () => {
  it('formats INR with the rupee symbol', () => {
    expect(formatCurrency(1234.5, 'INR')).toBe('₹1,234.50');
  });

  it('falls back for unknown currencies', () => {
    expect(formatCurrency(10, 'XYZ')).toBe('10.00 XYZ');
  });

  it('treats invalid input as zero', () => {
    expect(formatCurrency(Number.NaN)).toBe('₹0.00');
    expect(formatCurrency(null)).toBe('₹0.00');
  });
});

describe('formatMinutes', () => {
  it('formats sub-hour durations', () => {
    expect(formatMinutes(35)).toBe('35 min');
  });

  it('formats hour durations', () => {
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(95)).toBe('1h 35m');
  });

  it('handles missing values', () => {
    expect(formatMinutes(null)).toBe('—');
    expect(formatMinutes(undefined)).toBe('—');
  });
});

describe('formatDate', () => {
  it('returns an em dash for invalid values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats a valid ISO date', () => {
    expect(formatDate('2024-01-15T10:00:00.000Z')).toContain('2024');
  });
});

describe('titleCase', () => {
  it('converts snake_case to title case', () => {
    expect(titleCase('provider_confirmed')).toBe('Provider Confirmed');
  });
});

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings with an ellipsis', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });
});
