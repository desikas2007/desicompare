import { api } from '@/lib/api-client';
import { ensureCartId } from '@/lib/cart-id';
import type { CheckoutQuote } from '@/types';

export const checkoutService = {
  quote(location?: string): Promise<CheckoutQuote> {
    return api.post<CheckoutQuote>(
      '/checkout/quote',
      { location },
      { cartId: ensureCartId() || null },
    );
  },
};
