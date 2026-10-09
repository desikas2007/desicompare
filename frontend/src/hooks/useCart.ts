'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService, AddCartItemInput } from '@/services/cart.service';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiError } from '@/lib/api-client';
import type { Cart } from '@/types';

const CART_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: () => cartService.get(),
  });
}

export function useCartCount(): number {
  const { data } = useCart();
  if (!data) return 0;
  return data.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => cartService.addItem(input),
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      toast.success('Added to cart');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Could not add to cart';
      toast.error(message);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: (cart: Cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      toast.notify('Item removed');
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (cart: Cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}
