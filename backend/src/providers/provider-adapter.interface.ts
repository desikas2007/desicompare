import {
  IntegrationMode,
  ProviderCapability,
  QuoteStatus,
  SourceType,
} from '@foodcompare/shared-types';

export interface ProviderContext {
  providerId: string;
  providerSlug: string;
  providerName: string;
  integrationMode: IntegrationMode;
}

export interface QuoteRequest {
  providerRestaurantId: string;
  providerItemId: string;
  quantity: number;
  locationReference: string;
}

export interface NormalizedQuote {
  providerRestaurantId: string;
  providerItemId: string;
  foodName: string;
  restaurantName: string;
  portionSize: string;
  quantity: number;
  menuPrice: number;
  itemSubtotal: number;
  itemDiscount: number;
  deliveryFee: number;
  platformFee: number;
  packagingFee: number;
  tax: number;
  otherFees: number;
  couponDiscount: number;
  estimatedTotal: number;
  currency: string;
  available: boolean;
  quoteStatus: QuoteStatus;
  sourceType: SourceType;
  estimatedDeliveryMinutes?: number | null;
  expiresAt?: Date | null;
  notes: string[];
}

export interface ProviderFoodCandidate {
  providerRestaurantId: string;
  providerItemId: string;
  displayName: string;
  normalizedName: string;
  portionSize: string;
  menuPrice: number;
  currency: string;
  available: boolean;
}

export interface ProviderRestaurantCandidate {
  providerRestaurantId: string;
  restaurantName: string;
  cuisine: string[];
  officialUrl?: string | null;
  location?: string | null;
  available: boolean;
}

export interface ProviderOrderRequest {
  providerRestaurantId: string;
  items: Array<{ providerItemId: string; quantity: number }>;
  idempotencyKey: string;
  contact: { name: string; phone: string; address: string };
}

export interface ProviderOrderResult {
  supported: boolean;
  providerOrderReference?: string | null;
  providerStatus?: string | null;
  officialOrderUrl?: string | null;
  message: string;
}

export class ProviderOperationError extends Error {
  constructor(
    message: string,
    readonly code: 'unavailable' | 'not_supported' | 'timeout' | 'provider_error',
  ) {
    super(message);
    this.name = 'ProviderOperationError';
  }
}

/**
 * Contract every provider integration must satisfy. Implementations only need
 * to support the capabilities they actually advertise. Unsupported operations
 * must throw ProviderOperationError('not_supported') rather than fabricate data.
 */
export interface ProviderAdapter {
  readonly context: ProviderContext;
  readonly capabilities: ProviderCapability[];

  searchFood(query: string): Promise<ProviderFoodCandidate[]>;
  searchRestaurants(query: string): Promise<ProviderRestaurantCandidate[]>;
  getQuote(request: QuoteRequest): Promise<NormalizedQuote>;
  getOrderQuote(items: OrderQuoteLine[], locationReference: string): Promise<NormalizedQuote>;
  checkAvailability(providerRestaurantId: string, providerItemId: string): Promise<boolean>;
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;
}

export interface OrderQuoteLine {
  providerItemId: string;
  providerRestaurantId: string;
  quantity: number;
}
