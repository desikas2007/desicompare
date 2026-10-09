import { Model, Types } from 'mongoose';
import { ProviderCapability, QuoteStatus, SourceType } from '@foodcompare/shared-types';
import { computeFinalPrice } from '../../common/utils/money';
import { normalizeName } from '../../common/utils/normalize';
import { ProviderMenuItem } from '../../database/schemas/provider-menu-item.schema';
import { FoodItem } from '../../database/schemas/food-item.schema';
import { Restaurant } from '../../database/schemas/restaurant.schema';
import { ProviderRestaurant } from '../../database/schemas/provider-restaurant.schema';
import {
  NormalizedQuote,
  OrderQuoteLine,
  ProviderAdapter,
  ProviderContext,
  ProviderFoodCandidate,
  ProviderOperationError,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderRestaurantCandidate,
  QuoteRequest,
} from '../provider-adapter.interface';

interface FeeModel {
  deliveryFee: number;
  platformFee: number;
  packagingFee: number;
  taxRate: number;
  /** Fractional item discount applied above a subtotal threshold. */
  discountRate: number;
  discountThreshold: number;
  couponFlat: number;
  couponThreshold: number;
  etaBaseMinutes: number;
}

/**
 * Deterministic FEE MODEL used only for labelled demonstration data.
 * These values are NOT live provider charges. They exist so the comparison
 * engine and UI can be exercised end-to-end without authorized integrations.
 * Configure PROVIDER_INTEGRATION_MODE=live and implement a live adapter to
 * replace them with real, authorized quotes.
 */
const DEMO_FEE_MODEL: Record<string, FeeModel> = {
  swiggy: {
    deliveryFee: 25,
    platformFee: 12,
    packagingFee: 18,
    taxRate: 0.05,
    discountRate: 0.1,
    discountThreshold: 300,
    couponFlat: 0,
    couponThreshold: Number.POSITIVE_INFINITY,
    etaBaseMinutes: 30,
  },
  zomato: {
    deliveryFee: 30,
    platformFee: 15,
    packagingFee: 20,
    taxRate: 0.05,
    discountRate: 0,
    discountThreshold: 0,
    couponFlat: 50,
    couponThreshold: 400,
    etaBaseMinutes: 35,
  },
  eatsure: {
    deliveryFee: 20,
    platformFee: 8,
    packagingFee: 15,
    taxRate: 0.05,
    discountRate: 0.15,
    discountThreshold: 250,
    couponFlat: 0,
    couponThreshold: Number.POSITIVE_INFINITY,
    etaBaseMinutes: 40,
  },
};

const DEFAULT_FEE_MODEL: FeeModel = {
  deliveryFee: 25,
  platformFee: 10,
  packagingFee: 15,
  taxRate: 0.05,
  discountRate: 0,
  discountThreshold: 0,
  couponFlat: 0,
  couponThreshold: Number.POSITIVE_INFINITY,
  etaBaseMinutes: 35,
};

export interface DemoAdapterModels {
  providerMenuItem: Model<ProviderMenuItem>;
  foodItem: Model<FoodItem>;
  restaurant: Model<Restaurant>;
  providerRestaurant: Model<ProviderRestaurant>;
}

/**
 * Development/demonstration adapter. It reads seeded provider menu records from
 * MongoDB (sourceType = demo) and applies a documented, deterministic fee model.
 * Every produced quote is explicitly tagged as demo data.
 */
export class DemoProviderAdapter implements ProviderAdapter {
  constructor(
    readonly context: ProviderContext,
    private readonly models: DemoAdapterModels,
  ) {}

  get capabilities(): ProviderCapability[] {
    return [
      'search_food',
      'search_restaurants',
      'retrieve_menu',
      'check_availability',
      'get_quote',
      'get_offers',
    ];
  }

  async searchFood(query: string): Promise<ProviderFoodCandidate[]> {
    const normalized = normalizeName(query);
    if (!normalized) return [];
    const words = normalized.split(' ').filter((w) => w.length > 1);
    const regex = new RegExp(words.join('|') || normalized, 'i');
    const items = await this.models.providerMenuItem
      .find({ providerId: this.context.providerId, displayName: regex })
      .limit(30)
      .lean()
      .exec();
    return items.map((item) => ({
      providerRestaurantId: item.providerRestaurantId,
      providerItemId: item.providerItemId,
      displayName: item.displayName,
      normalizedName: normalizeName(item.displayName),
      portionSize: item.variant ?? '',
      menuPrice: item.menuPrice,
      currency: item.currency,
      available: item.availability,
    }));
  }

  async searchRestaurants(query: string): Promise<ProviderRestaurantCandidate[]> {
    const normalized = normalizeName(query);
    const links = await this.models.providerRestaurant
      .find({ providerId: this.context.providerId, availability: true })
      .limit(50)
      .lean()
      .exec();
    if (!normalized) {
      return links.map((l) => this.toRestaurantCandidate(l, ''));
    }
    const restaurantIds = links.map((l) => l.restaurantId);
    const matches = await this.models.restaurant
      .find({ _id: { $in: restaurantIds }, normalizedName: new RegExp(normalized, 'i') })
      .lean()
      .exec();
    const allowed = new Set(matches.map((r) => String(r._id)));
    return links
      .filter((l) => allowed.has(String(l.restaurantId)))
      .map((l) => this.toRestaurantCandidate(l, ''));
  }

  private toRestaurantCandidate(
    link: ProviderRestaurant & { _id?: unknown },
    name: string,
  ): ProviderRestaurantCandidate {
    return {
      providerRestaurantId: link.providerRestaurantId,
      restaurantName: name,
      cuisine: [],
      officialUrl: link.officialUrl ?? null,
      location: link.location ?? null,
      available: link.availability,
    };
  }

  async checkAvailability(providerRestaurantId: string, providerItemId: string): Promise<boolean> {
    const item = await this.models.providerMenuItem
      .findOne({
        providerId: this.context.providerId,
        providerRestaurantId,
        providerItemId,
      })
      .lean()
      .exec();
    return Boolean(item?.availability);
  }

  async getQuote(request: QuoteRequest): Promise<NormalizedQuote> {
    const item = await this.models.providerMenuItem
      .findOne({
        providerId: this.context.providerId,
        providerRestaurantId: request.providerRestaurantId,
        providerItemId: request.providerItemId,
      })
      .lean()
      .exec();

    if (!item) {
      throw new ProviderOperationError(
        `Item ${request.providerItemId} is not available on ${this.context.providerName}`,
        'unavailable',
      );
    }

    const [food, link] = await Promise.all([
      this.models.foodItem.findById(item.normalizedFoodId).lean().exec(),
      this.models.providerRestaurant
        .findOne({
          providerId: this.context.providerId,
          providerRestaurantId: request.providerRestaurantId,
        })
        .lean()
        .exec(),
    ]);

    const restaurant = link
      ? await this.models.restaurant.findById(link.restaurantId).lean().exec()
      : null;

    const fee = DEMO_FEE_MODEL[this.context.providerSlug] ?? DEFAULT_FEE_MODEL;
    const quantity = Math.max(1, request.quantity || 1);
    const subtotal = item.menuPrice * quantity;

    const itemDiscount =
      fee.discountRate > 0 && subtotal >= fee.discountThreshold
        ? Number((subtotal * fee.discountRate).toFixed(2))
        : 0;
    const couponDiscount = subtotal >= fee.couponThreshold ? fee.couponFlat : 0;
    const tax = Number((subtotal * fee.taxRate).toFixed(2));

    const computed = computeFinalPrice({
      itemSubtotal: subtotal,
      itemDiscount,
      deliveryFee: fee.deliveryFee,
      platformFee: fee.platformFee,
      packagingFee: fee.packagingFee,
      tax,
      couponDiscount,
    });

    const eta = this.estimateEta(fee.etaBaseMinutes, request.locationReference, item.menuPrice);
    const now = new Date();

    const notes: string[] = ['Demonstration pricing — not a live provider quote.'];
    if (itemDiscount > 0)
      notes.push(`Includes an illustrative ${Math.round(fee.discountRate * 100)}% item discount.`);
    if (couponDiscount > 0) notes.push('Includes an illustrative coupon discount.');

    return {
      providerRestaurantId: request.providerRestaurantId,
      providerItemId: request.providerItemId,
      foodName: food?.displayName ?? item.displayName,
      restaurantName: restaurant?.displayName ?? 'Restaurant',
      portionSize: item.variant ?? food?.portionSize ?? '',
      quantity,
      menuPrice: item.menuPrice,
      itemSubtotal: computed.itemSubtotal,
      itemDiscount: computed.itemDiscount,
      deliveryFee: computed.deliveryFee,
      platformFee: computed.platformFee,
      packagingFee: computed.packagingFee,
      tax: computed.tax,
      otherFees: computed.otherFees,
      couponDiscount: computed.couponDiscount,
      estimatedTotal: computed.estimatedTotal,
      currency: item.currency,
      available: item.availability,
      quoteStatus: item.availability ? QuoteStatus.Complete : QuoteStatus.Unavailable,
      sourceType: SourceType.Demo,
      estimatedDeliveryMinutes: eta,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      notes,
    };
  }

  async getOrderQuote(
    items: OrderQuoteLine[],
    locationReference: string,
  ): Promise<NormalizedQuote> {
    if (items.length === 0) {
      throw new ProviderOperationError('The cart is empty', 'not_supported');
    }

    let subtotal = 0;
    let currency = 'INR';
    let totalQuantity = 0;
    for (const line of items) {
      const item = await this.models.providerMenuItem
        .findOne({
          providerId: this.context.providerId,
          providerRestaurantId: line.providerRestaurantId,
          providerItemId: line.providerItemId,
        })
        .lean()
        .exec();
      if (!item) {
        throw new ProviderOperationError(
          `Item ${line.providerItemId} is no longer available on ${this.context.providerName}`,
          'unavailable',
        );
      }
      subtotal += item.menuPrice * line.quantity;
      currency = item.currency;
      totalQuantity += line.quantity;
    }

    const fee = DEMO_FEE_MODEL[this.context.providerSlug] ?? DEFAULT_FEE_MODEL;
    const itemDiscount =
      fee.discountRate > 0 && subtotal >= fee.discountThreshold
        ? Number((subtotal * fee.discountRate).toFixed(2))
        : 0;
    const couponDiscount = subtotal >= fee.couponThreshold ? fee.couponFlat : 0;
    const tax = Number((subtotal * fee.taxRate).toFixed(2));

    const computed = computeFinalPrice({
      itemSubtotal: subtotal,
      itemDiscount,
      deliveryFee: fee.deliveryFee,
      platformFee: fee.platformFee,
      packagingFee: fee.packagingFee,
      tax,
      couponDiscount,
    });

    const now = new Date();
    return {
      providerRestaurantId: items[0].providerRestaurantId,
      providerItemId: items[0].providerItemId,
      foodName: 'Cart order',
      restaurantName: 'Selected restaurant',
      portionSize: '',
      quantity: totalQuantity,
      menuPrice: subtotal,
      itemSubtotal: computed.itemSubtotal,
      itemDiscount: computed.itemDiscount,
      deliveryFee: computed.deliveryFee,
      platformFee: computed.platformFee,
      packagingFee: computed.packagingFee,
      tax: computed.tax,
      otherFees: computed.otherFees,
      couponDiscount: computed.couponDiscount,
      estimatedTotal: computed.estimatedTotal,
      currency,
      available: true,
      quoteStatus: QuoteStatus.Complete,
      sourceType: SourceType.Demo,
      estimatedDeliveryMinutes: this.estimateEta(fee.etaBaseMinutes, locationReference, subtotal),
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      notes: ['Demonstration pricing — not a live provider quote.'],
    };
  }

  async createOrder(_request: ProviderOrderRequest): Promise<ProviderOrderResult> {
    throw new ProviderOperationError(
      'Direct ordering is not available in demonstration mode. Use the provider application to complete this order.',
      'not_supported',
    );
  }

  private estimateEta(base: number, locationReference: string, price: number): number {
    const locationHash = [...(locationReference || 'default')].reduce(
      (acc, ch) => acc + ch.charCodeAt(0),
      0,
    );
    return base + (locationHash % 10) + (price > 250 ? 5 : 0);
  }
}

/**
 * A provider that is configured but has no authorized integration. It reports
 * its state honestly instead of fabricating data.
 */
export class UnconfiguredProviderAdapter implements ProviderAdapter {
  constructor(readonly context: ProviderContext) {}

  get capabilities(): ProviderCapability[] {
    return ['get_offers'];
  }

  async searchFood(): Promise<ProviderFoodCandidate[]> {
    return [];
  }

  async searchRestaurants(): Promise<ProviderRestaurantCandidate[]> {
    return [];
  }

  async checkAvailability(): Promise<boolean> {
    return false;
  }

  async getQuote(): Promise<NormalizedQuote> {
    throw new ProviderOperationError(
      `${this.context.providerName} live pricing is not configured. No authorized integration is available.`,
      'not_supported',
    );
  }

  async getOrderQuote(): Promise<NormalizedQuote> {
    throw new ProviderOperationError(
      `${this.context.providerName} live pricing is not configured. No authorized integration is available.`,
      'not_supported',
    );
  }

  async createOrder(): Promise<ProviderOrderResult> {
    throw new ProviderOperationError(
      `${this.context.providerName} does not expose an authorized ordering integration.`,
      'not_supported',
    );
  }
}

export function objectId(value: string): Types.ObjectId {
  return new Types.ObjectId(value);
}
