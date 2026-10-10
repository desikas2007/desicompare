'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Form';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';

const MODES = ['demo', 'live', 'unconfigured', 'outage', 'unsupported_ordering'];

export default function AdminPage() {
  const { user, status } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const stats = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.stats(),
    enabled: status === 'authenticated' && user?.role === 'admin',
  });

  const providers = useQuery({
    queryKey: ['admin-providers'],
    queryFn: () => adminService.listProviders(),
    enabled: status === 'authenticated' && user?.role === 'admin',
  });

  const updateProvider = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { enabled?: boolean; integrationMode?: string } }) =>
      adminService.updateProvider(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider updated');
    },
    onError: () => toast.error('Could not update provider'),
  });

  if (status === 'loading') {
    return <Skeleton height={200} radius={16} />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Admin access required</h1>
        <p className="mt-1 text-sm text-ink-soft">You do not have permission to view this page.</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Platform overview and provider integration status.
        </p>
      </header>

      {stats.isError ? (
        <ErrorState message="Could not load admin statistics." />
      ) : stats.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} height={90} radius={16} />
          ))}
        </div>
      ) : stats.data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Users" value={stats.data.counts.users} />
          <Stat label="Restaurants" value={stats.data.counts.restaurants} />
          <Stat label="Food items" value={stats.data.counts.foodItems} />
          <Stat label="Menu listings" value={stats.data.counts.providerMenuItems} />
          <Stat label="Comparisons" value={stats.data.counts.comparisons} />
          <Stat label="Orders" value={stats.data.counts.orders} />
          <Stat label="Active quotes" value={stats.data.counts.activePriceQuotes} />
          <Stat label="Stale quotes" value={stats.data.staleQuotes} />
        </div>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-ink">Providers</h2>
        {providers.isLoading ? (
          <div className="mt-4">
            <Skeleton height={200} radius={12} />
          </div>
        ) : providers.data ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-3 font-semibold">Provider</th>
                  <th className="px-3 py-3 font-semibold">Integration</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {providers.data.map((provider) => (
                  <tr key={provider.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-3 align-top">
                      <div className="font-semibold text-ink">{provider.name}</div>
                      <div className="text-xs text-muted">{provider.slug}</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Select
                        value={provider.integrationMode}
                        onChange={(event) =>
                          updateProvider.mutate({
                            id: provider.id,
                            input: { integrationMode: event.target.value },
                          })
                        }
                        className="w-auto min-w-[10rem]"
                        aria-label={`Integration mode for ${provider.name}`}
                      >
                        {MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Badge tone={provider.enabled ? 'success' : 'neutral'}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-muted">
                      {provider.capabilities.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="text-2xl font-extrabold tracking-tight text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
