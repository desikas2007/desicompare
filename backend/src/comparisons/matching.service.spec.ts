import { MatchConfidence } from '@foodcompare/shared-types';
import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  const service = new MatchingService();

  const candidates = [
    { id: '1', displayName: 'Chicken Biryani (Full)', normalizedName: 'chicken biryani full' },
    { id: '2', displayName: 'Mutton Biryani', normalizedName: 'mutton biryani' },
    { id: '3', displayName: 'Veg Biryani', normalizedName: 'veg biryani' },
    { id: '4', displayName: 'Margherita Pizza', normalizedName: 'margherita pizza' },
  ];

  it('returns an exact match when the normalized names are identical', () => {
    const outcome = service.match('mutton biryani', candidates);
    expect(outcome.candidate?.id).toBe('2');
    expect(outcome.confidence).toBe(MatchConfidence.Exact);
  });

  it('returns an approximate match for partial overlap', () => {
    const outcome = service.match('chicken biryani', candidates);
    expect(outcome.candidate?.id).toBe('1');
    expect([MatchConfidence.Exact, MatchConfidence.Approximate]).toContain(outcome.confidence);
  });

  it('does not match unrelated items with high confidence', () => {
    const outcome = service.match('sushi platter', candidates);
    expect(outcome.confidence).not.toBe(MatchConfidence.Exact);
    expect(outcome.score).toBeLessThan(0.6);
  });

  it('handles empty queries and candidate lists', () => {
    expect(service.match('', candidates).candidate).toBeNull();
    expect(service.match('biryani', []).candidate).toBeNull();
  });

  it('notes the compared portion so the user can confirm', () => {
    const outcome = service.match('chicken biryani full', [
      {
        id: '1',
        displayName: 'Chicken Biryani (Full)',
        normalizedName: 'chicken biryani full',
        portionSize: 'Full',
      },
    ]);
    expect(outcome.note.toLowerCase()).toContain('portion');
  });
});
