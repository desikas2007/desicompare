import { api } from '@/lib/api-client';
import type { AddressSummary, FavoriteSummary, UserProfile } from '@/types';

export interface UpdateProfileInput {
  name?: string;
  mobile?: string;
}

export interface AddressInput {
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
  isDefault?: boolean;
}

export const userService = {
  getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>('/users/me');
  },

  updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return api.patch<UserProfile>('/users/me', input);
  },

  listAddresses(): Promise<AddressSummary[]> {
    return api.get<AddressSummary[]>('/users/me/addresses');
  },

  createAddress(input: AddressInput): Promise<AddressSummary> {
    return api.post<AddressSummary>('/users/me/addresses', input);
  },

  updateAddress(id: string, input: Partial<AddressInput>): Promise<AddressSummary> {
    return api.patch<AddressSummary>(`/users/me/addresses/${id}`, input);
  },

  deleteAddress(id: string): Promise<void> {
    return api.delete<void>(`/users/me/addresses/${id}`);
  },

  listFavorites(): Promise<FavoriteSummary[]> {
    return api.get<FavoriteSummary[]>('/users/me/favorites');
  },

  addFavorite(input: { restaurantId?: string; foodItemId?: string }): Promise<FavoriteSummary> {
    return api.post<FavoriteSummary>('/users/me/favorites', input);
  },

  removeFavorite(id: string): Promise<void> {
    return api.delete<void>(`/users/me/favorites/${id}`);
  },
};
