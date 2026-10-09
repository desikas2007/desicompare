import { api } from '@/lib/api-client';
import { ensureCartId } from '@/lib/cart-id';
import type { Cart } from '@/types';

function cartHeader(): string | null {
  const id = ensureCartId();
  return id || null;
}

export interface AddCartItemInput {
  foodItemId: string;
  providerMenuItemId?: string;
  quantity: number;
}

export const cartService = {
  get(): Promise<Cart> {
    return api.get<Cart>('/cart', { cartId: cartHeader() });
  },

  addItem(input: AddCartItemInput): Promise<Cart> {
    return api.post<Cart>('/cart/items', input, { cartId: cartHeader() });
  },

  updateItem(itemId: string, quantity: number): Promise<Cart> {
    return api.patch<Cart>(`/cart/items/${itemId}`, { quantity }, { cartId: cartHeader() });
  },

  removeItem(itemId: string): Promise<Cart> {
    return api.delete<Cart>(`/cart/items/${itemId}`, { cartId: cartHeader() });
  },

  clear(): Promise<Cart> {
    return api.delete<Cart>('/cart', { cartId: cartHeader() });
  },
};
