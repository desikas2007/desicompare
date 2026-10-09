import { api } from '@/lib/api-client';
import type { AdminStats, ProviderSummary } from '@/types';

export const adminService = {
  stats(): Promise<AdminStats> {
    return api.get<AdminStats>('/admin/stats');
  },

  listProviders(): Promise<ProviderSummary[]> {
    return api.get<ProviderSummary[]>('/admin/providers');
  },

  updateProvider(
    id: string,
    input: { enabled?: boolean; integrationMode?: string; statusNote?: string },
  ): Promise<ProviderSummary> {
    return api.patch<ProviderSummary>(`/admin/providers/${id}`, input);
  },

  updateOfferStatus(
    id: string,
    status: 'verified' | 'unverified' | 'demo' | 'expired',
  ): Promise<{ id: string; verificationStatus: string }> {
    return api.patch<{ id: string; verificationStatus: string }>(
      `/admin/offers/${id}/status`,
      { status },
    );
  },
};
