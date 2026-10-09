import { api } from '@/lib/api-client';
import type { ProviderStatus, ProviderSummary } from '@/types';

export const providerService = {
  list(): Promise<ProviderSummary[]> {
    return api.get<ProviderSummary[]>('/providers', { auth: false });
  },

  status(id: string): Promise<ProviderStatus> {
    return api.get<ProviderStatus>(`/providers/${id}/status`, { auth: false });
  },
};
