/**
 * FoodCompare shared contracts.
 * These types are runtime-safe (no backend/frontend specific imports) so both
 * the NestJS API and the Next.js web app can depend on them.
 */

/* ------------------------------------------------------------------ */
/* Envelope                                                            */
/* ------------------------------------------------------------------ */

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiError {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/* ------------------------------------------------------------------ */
/* Roles / status                                                      */
/* ------------------------------------------------------------------ */

export const UserRole = {
  User: 'user',
  Admin: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountStatus = {
  Active: 'active',
  Suspended: 'suspended',
  Pending: 'pending',
} as const;
export type AccountStatus =
  (typeof AccountStatus)[keyof typeof AccountStatus];

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export const IntegrationMode = {
  Live: 'live',
  Unconfigured: 'unconfigured',
  Outage: 'outage',
  UnsupportedOrdering: 'unsupported_ordering',
  Demo: 'demo',
} as const;
export type IntegrationMode =
  (typeof IntegrationMode)[keyof typeof IntegrationMode];

export const SourceType = {
  Live: 'live',
  Demo: 'demo',
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export type ProviderCapability =
  | 'search_food'
  | 'search_restaurants'
  | 'retrieve_menu'
  | 'check_availability'
  | 'get_quote'
  | 'get_offers'
  | 'create_order'
  | 'get_order_status';

export interface ProviderSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  enabled: boolean;
  integrationMode: IntegrationMode;
  capabilities: ProviderCapability[];
  officialWebsite?: string | null;
  lastSuccessfulSync?: string | null;
  statusNote?: string | null;
}

/* ------------------------------------------------------------------ */
/* Restaurants / food items                                            */
/* ------------------------------------------------------------------ */

export interface RestaurantSummary {
  id: string;
  displayName: string;
  normalizedName: string;
  cuisine: string[];
  imageUrl?: string | null;
  address?: string | null;
  serviceArea?: string | null;
  rating?: number | null;
  isActive: boolean;
}

export interface FoodVariant {
  name: string;
  portionSize: string;
  price?: number | null;
}

/** Meal slots a dish belongs to, used to group the dishes menu. */
export const MealType = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

export interface FoodItemSummary {
  id: string;
  restaurantId: string;
  displayName: string;
  normalizedName: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  dietaryType: DietaryType;
  portionSize: string;
  variants: FoodVariant[];
  mealTypes: MealType[];
  isActive: boolean;
}

export const DietaryType = {
  Veg: 'veg',
  NonVeg: 'non_veg',
  Vegan: 'vegan',
  Unknown: 'unknown',
} as const;
export type DietaryType = (typeof DietaryType)[keyof typeof DietaryType];

/* ------------------------------------------------------------------ */
/* Price comparison                                                    */
/* ------------------------------------------------------------------ */

export interface PriceBreakdown {
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

export const QuoteStatus = {
  Complete: 'complete',
  Incomplete: 'incomplete',
  Estimated: 'estimated',
  Expired: 'expired',
  Unavailable: 'unavailable',
} as const;
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const MatchConfidence = {
  Exact: 'exact',
  Approximate: 'approximate',
  Uncertain: 'uncertain',
} as const;
export type MatchConfidence =
  (typeof MatchConfidence)[keyof typeof MatchConfidence];

export interface ProviderQuote {
  providerId: string;
  providerName: string;
  providerSlug: string;
  integrationMode: IntegrationMode;
  sourceType: SourceType;
  restaurantName: string;
  foodName: string;
  portionSize: string;
  quantity: number;
  breakdown: PriceBreakdown;
  currency: string;
  quoteStatus: QuoteStatus;
  available: boolean;
  estimatedDeliveryMinutes?: number | null;
  quoteTimestamp: string;
  expiresAt?: string | null;
  orderingCapability: 'direct' | 'external' | 'none';
  officialOrderUrl?: string | null;
  notes?: string[];
}

export interface ComparisonResult {
  id: string;
  searchQuery: string;
  locationReference: string;
  quantity: number;
  matchConfidence: MatchConfidence;
  matchNote?: string | null;
  quotes: ProviderQuote[];
  bestQuote?: ProviderQuote | null;
  potentialSavings: number;
  savingsPercentage: number;
  currency: string;
  createdAt: string;
  isDemoData: boolean;
}

/* ------------------------------------------------------------------ */
/* Offers                                                              */
/* ------------------------------------------------------------------ */

export const DiscountType = {
  Flat: 'flat',
  Percentage: 'percentage',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export interface OfferSummary {
  id: string;
  providerId: string;
  providerName?: string;
  restaurantId?: string | null;
  code?: string | null;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue?: number | null;
  maximumDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  terms?: string | null;
  verificationStatus: 'verified' | 'unverified' | 'demo' | 'expired';
}

/* ------------------------------------------------------------------ */
/* Cart / checkout / orders                                            */
/* ------------------------------------------------------------------ */

export interface CartItem {
  id: string;
  foodItemId: string;
  providerMenuItemId?: string | null;
  name: string;
  portionSize: string;
  unitPrice: number;
  quantity: number;
  available: boolean;
}

export interface Cart {
  id: string;
  providerId?: string | null;
  providerName?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  items: CartItem[];
  subtotal: number;
  currency: string;
  quoteReference?: string | null;
  quoteExpiresAt?: string | null;
  updatedAt: string;
}

export interface OrderPriceBreakdown extends PriceBreakdown {
  currency: string;
}

export const InternalOrderStatus = {
  Draft: 'draft',
  Redirected: 'redirected',
  Submitted: 'submitted',
  Confirmed: 'confirmed',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;
export type InternalOrderStatus =
  (typeof InternalOrderStatus)[keyof typeof InternalOrderStatus];

export const OrderConfirmationStatus = {
  NotConfirmed: 'not_confirmed',
  Pending: 'pending',
  ProviderConfirmed: 'provider_confirmed',
} as const;
export type OrderConfirmationStatus =
  (typeof OrderConfirmationStatus)[keyof typeof OrderConfirmationStatus];

export interface OrderSummary {
  id: string;
  internalReference: string;
  providerId: string;
  providerName?: string;
  restaurantId?: string | null;
  restaurantName?: string | null;
  items: CartItem[];
  priceBreakdown: OrderPriceBreakdown;
  internalStatus: InternalOrderStatus;
  providerOrderReference?: string | null;
  providerStatus?: string | null;
  orderConfirmationStatus: OrderConfirmationStatus;
  officialOrderUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Addresses / favorites                                               */
/* ------------------------------------------------------------------ */

export interface AddressSummary {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface FavoriteSummary {
  id: string;
  restaurantId?: string | null;
  foodItemId?: string | null;
  restaurantName?: string | null;
  foodItemName?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Customer feedback                                                    */
/* ------------------------------------------------------------------ */

export const FeedbackCategory = {
  General: 'general',
  AppExperience: 'app_experience',
  Restaurant: 'restaurant',
  Dish: 'dish',
  Pricing: 'pricing',
  Delivery: 'delivery',
  Bug: 'bug',
  Other: 'other',
} as const;
export type FeedbackCategory =
  (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

export const FeedbackStatus = {
  New: 'new',
  InReview: 'in_review',
  Resolved: 'resolved',
  Dismissed: 'dismissed',
} as const;
export type FeedbackStatus =
  (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export interface FeedbackSummary {
  id: string;
  userId: string;
  userName?: string | null;
  category: FeedbackCategory;
  rating: number | null;
  message: string;
  restaurantId?: string | null;
  foodItemId?: string | null;
  restaurantName?: string | null;
  foodItemName?: string | null;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  emailVerified: boolean;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  expiresIn: number;
}

/* ------------------------------------------------------------------ */
/* Search                                                             */
/* ------------------------------------------------------------------ */

export interface SearchFilters {
  q?: string;
  category?: string;
  cuisine?: string;
  provider?: string;
  dietaryType?: DietaryType;
  mealType?: MealType;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDeliveryMinutes?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'delivery_asc' | 'relevance';
  page?: number;
  limit?: number;
}
