import { api } from '@/lib/api-client';
import { ensureCartId } from '@/lib/cart-id';
import type { OrderSummary, Paginated } from '@/types';

export interface CreateOrderInput {
  idempotencyKey: string;
  addressId?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `order_${crypto.randomUUID()}`;
  }
  return `order_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export const orderService = {
  create(input: Omit<CreateOrderInput, 'idempotencyKey'> & { idempotencyKey?: string }): Promise<OrderSummary> {
    const body: CreateOrderInput = {
      ...input,
      idempotencyKey: input.idempotencyKey ?? newIdempotencyKey(),
    };
    return api.post<OrderSummary>('/orders', body, { cartId: ensureCartId() || null });
  },

  async list(page = 1, limit = 10): Promise<Paginated<OrderSummary>> {
    const { data, meta } = await api.getWithMeta<OrderSummary[]>('/orders', {
      query: { page, limit },
    });
    return {
      items: data,
      meta: {
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
        total: meta?.total ?? data.length,
        totalPages: meta?.totalPages ?? 1,
      },
    };
  },

  get(id: string): Promise<OrderSummary> {
    return api.get<OrderSummary>(`/orders/${id}`);
  },
};
