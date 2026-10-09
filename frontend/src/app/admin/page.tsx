'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import styles from './admin.module.css';

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
    return (
      <div className="container section stack">
        <Skeleton height={200} radius={18} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container section">
        <div className={styles.denied}>
          <h1 className="section-title">Admin access required</h1>
          <p className="muted">You do not have permission to view this page.</p>
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">Admin dashboard</h1>
      <p className="section-subtitle">Platform overview and provider integration status.</p>

      {stats.isError ? (
        <ErrorState message="Could not load admin statistics." />
      ) : stats.isLoading ? (
        <div className={styles.statGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} height={90} radius={18} />
          ))}
        </div>
      ) : stats.data ? (
        <div className={styles.statGrid}>
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

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Providers</h2>
        {providers.isLoading ? (
          <Skeleton height={200} radius={14} />
        ) : providers.data ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Integration</th>
                <th>Enabled</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {providers.data.map((provider) => (
                <tr key={provider.id}>
                  <td>
                    <strong>{provider.name}</strong>
                    <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {provider.slug}
                    </div>
                  </td>
                  <td>
                    <select
                      value={provider.integrationMode}
                      onChange={(event) =>
                        updateProvider.mutate({
                          id: provider.id,
                          input: { integrationMode: event.target.value },
                        })
                      }
                      aria-label={`Integration mode for ${provider.name}`}
                    >
                      {MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Badge tone={provider.enabled ? 'success' : 'neutral'}>
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {provider.capabilities.join(', ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
