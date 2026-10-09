import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = number | string | Decimal | null | undefined;

export const money = (value: MoneyInput): Decimal => {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  try {
    return new Decimal(value as Decimal.Value);
  } catch {
    return new Decimal(0);
  }
};

/** Rounds to 2 decimal places and returns a plain number (for storage/transport). */
export const round2 = (value: MoneyInput): number => money(value).toDecimalPlaces(2).toNumber();

/** Returns a fixed 2-decimal string. */
export const format2 = (value: MoneyInput): string => money(value).toDecimalPlaces(2).toFixed(2);

export interface PriceInputs {
  itemSubtotal: MoneyInput;
  itemDiscount?: MoneyInput;
  deliveryFee?: MoneyInput;
  platformFee?: MoneyInput;
  packagingFee?: MoneyInput;
  tax?: MoneyInput;
  otherFees?: MoneyInput;
  couponDiscount?: MoneyInput;
}

export interface ComputedPrice {
  itemSubtotal: number;
  itemDiscount: number;
  deliveryFee: number;
  platformFee: number;
  packagingFee: number;
  tax: number;
  otherFees: number;
  couponDiscount: number;
  estimatedTotal: number;
}

/**
 * Provider-aware, decimal-safe final payable calculation.
 *
 * final = subtotal - itemDiscount + delivery + platform + packaging + tax + other - coupon
 *
 * Discounts are capped so a component may never make the total negative.
 */
export function computeFinalPrice(inputs: PriceInputs): ComputedPrice {
  const itemSubtotal = money(inputs.itemSubtotal);
  const itemDiscount = Decimal.min(money(inputs.itemDiscount), itemSubtotal);
  const deliveryFee = Decimal.max(money(inputs.deliveryFee), 0);
  const platformFee = Decimal.max(money(inputs.platformFee), 0);
  const packagingFee = Decimal.max(money(inputs.packagingFee), 0);
  const tax = Decimal.max(money(inputs.tax), 0);
  const otherFees = Decimal.max(money(inputs.otherFees), 0);

  const preCoupon = itemSubtotal
    .minus(itemDiscount)
    .plus(deliveryFee)
    .plus(platformFee)
    .plus(packagingFee)
    .plus(tax)
    .plus(otherFees);

  const couponDiscount = Decimal.min(Decimal.max(money(inputs.couponDiscount), 0), preCoupon);
  const estimatedTotal = Decimal.max(preCoupon.minus(couponDiscount), 0);

  return {
    itemSubtotal: round2(itemSubtotal),
    itemDiscount: round2(itemDiscount),
    deliveryFee: round2(deliveryFee),
    platformFee: round2(platformFee),
    packagingFee: round2(packagingFee),
    tax: round2(tax),
    otherFees: round2(otherFees),
    couponDiscount: round2(couponDiscount),
    estimatedTotal: round2(estimatedTotal),
  };
}

/** Savings and percentage given a best and worst comparable total. */
export function computeSavings(
  best: MoneyInput,
  worst: MoneyInput,
): { amount: number; percentage: number } {
  const bestD = money(best);
  const worstD = money(worst);
  const amount = Decimal.max(worstD.minus(bestD), 0);
  const percentage = worstD.gt(0) ? amount.dividedBy(worstD).times(100) : new Decimal(0);
  return {
    amount: round2(amount),
    percentage: Number(percentage.toDecimalPlaces(1).toNumber()),
  };
}
