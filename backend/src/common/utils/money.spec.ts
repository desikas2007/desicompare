import { computeFinalPrice, computeSavings, money, round2 } from './money';

describe('money utilities', () => {
  it('keeps monetary arithmetic decimal-safe (avoids float drift)', () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point; our engine must be exact.
    const result = computeFinalPrice({
      itemSubtotal: '0.10',
      deliveryFee: '0.20',
    });
    expect(result.estimatedTotal).toBe(0.3);
  });

  it('computes the final payable amount with all components', () => {
    const result = computeFinalPrice({
      itemSubtotal: 349,
      itemDiscount: 34.9,
      deliveryFee: 25,
      platformFee: 12,
      packagingFee: 18,
      tax: 17.45,
      couponDiscount: 0,
    });
    // 349 - 34.9 + 25 + 12 + 18 + 17.45 = 386.55
    expect(result.estimatedTotal).toBeCloseTo(386.55, 2);
  });

  it('never double-counts and caps discounts so totals stay non-negative', () => {
    const result = computeFinalPrice({
      itemSubtotal: 100,
      itemDiscount: 500,
      couponDiscount: 500,
    });
    expect(result.estimatedTotal).toBe(0);
    expect(result.itemDiscount).toBe(100);
  });

  it('treats missing fees as zero', () => {
    const result = computeFinalPrice({ itemSubtotal: 199 });
    expect(result.estimatedTotal).toBe(199);
    expect(result.deliveryFee).toBe(0);
  });

  it('computes savings and percentage between best and worst', () => {
    const savings = computeSavings(300, 400);
    expect(savings.amount).toBe(100);
    expect(savings.percentage).toBe(25);
  });

  it('reports zero savings when there is nothing to save', () => {
    expect(computeSavings(400, 400).amount).toBe(0);
    expect(computeSavings(400, 300).amount).toBe(0);
  });

  it('rounds to two decimals', () => {
    expect(round2(12.345)).toBe(12.35);
    expect(money('99.999').toDecimalPlaces(2).toNumber()).toBe(100);
  });
});
