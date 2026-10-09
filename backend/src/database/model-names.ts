import { Connection } from 'mongoose';

export const ModelNames = {
  User: 'User',
  Address: 'Address',
  Provider: 'Provider',
  Restaurant: 'Restaurant',
  ProviderRestaurant: 'ProviderRestaurant',
  FoodItem: 'FoodItem',
  ProviderMenuItem: 'ProviderMenuItem',
  PriceQuote: 'PriceQuote',
  Offer: 'Offer',
  Favorite: 'Favorite',
  Comparison: 'Comparison',
  Cart: 'Cart',
  Order: 'Order',
  RefreshSession: 'RefreshSession',
} as const;

export type DatabaseConnection = Connection;
