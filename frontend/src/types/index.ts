import type {
  Cart,
  CartItem,
  ComparisonResult,
  FavoriteSummary,
  FoodItemSummary,
  OfferSummary,
  ProviderQuote,
  ProviderSummary,
  RestaurantSummary,
} from '@foodcompare/shared-types';

export type {
  ApiError,
  ApiErrorBody,
  ApiMeta,
  ApiSuccess,
  AddressSummary,
  AuthSession,
  Cart,
  CartItem,
  ComparisonResult,
  DietaryType,
  DiscountType,
  FavoriteSummary,
  FoodItemSummary,
  FoodVariant,
  IntegrationMode,
  InternalOrderStatus,
  MatchConfidence,
  OfferSummary,
  OrderConfirmationStatus,
  OrderPriceBreakdown,
  OrderSummary,
  PriceBreakdown,
  ProviderCapability,
  ProviderQuote,
  ProviderSummary,
  QuoteStatus,
  RestaurantSummary,
  SearchFilters,
  SourceType,
  UserProfile,
  UserRole,
} from '@foodcompare/shared-types';

export { DietaryType as DietaryTypeEnum, QuoteStatus as QuoteStatusEnum } from '@foodcompare/shared-types';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface SearchFoodItem extends FoodItemSummary {
  minPrice: number | null;
  providerCount: number;
}

export interface SearchResult {
  foodItems: Paginated<SearchFoodItem>;
  restaurants: RestaurantSummary[];
  categories: string[];
  suggestions: string[];
}

export interface RestaurantDetail extends RestaurantSummary {
  menu: FoodItemSummary[];
  providers: Array<{ id: string; name: string; slug: string; officialUrl: string | null }>;
}

export interface ProviderStatus {
  provider: ProviderSummary;
  healthy: boolean;
  detail: string;
}

export interface CheckoutQuote {
  providerId: string | null;
  providerName: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  items: Array<{ id: string; name: string; unitPrice: number; quantity: number }>;
  breakdown: {
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
  };
  quoteStatus: 'complete' | 'incomplete' | 'estimated' | 'unavailable';
  quoteTimestamp: string;
  expiresAt: string | null;
  sourceType: string;
  isDemoData: boolean;
  notes: string[];
}

export interface AdminStats {
  counts: {
    users: number;
    restaurants: number;
    foodItems: number;
    providerMenuItems: number;
    offers: number;
    orders: number;
    comparisons: number;
    activePriceQuotes: number;
  };
  providers: ProviderStatus[];
  recentProviderFailures: number;
  staleQuotes: number;
}
