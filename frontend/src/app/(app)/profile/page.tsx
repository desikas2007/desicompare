'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { userService, AddressInput } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { addressSchema, AddressValues } from '@/lib/validation';

export default function ProfilePage() {
  const { user, status, refreshUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<string | 'new' | null>(null);

  const profileForm = useForm<{ name: string; mobile: string }>({
    defaultValues: { name: '', mobile: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, mobile: user.mobile ?? '' });
    }
  }, [user, profileForm]);

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.listAddresses(),
    enabled: status === 'authenticated',
  });

  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userService.listFavorites(),
    enabled: status === 'authenticated',
  });

  const saveProfile = useMutation({
    mutationFn: (values: { name: string; mobile: string }) =>
      userService.updateProfile({ name: values.name, mobile: values.mobile || undefined }),
    onSuccess: async () => {
      toast.success('Profile updated');
      await refreshUser();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not update profile');
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.notify('Address removed');
    },
  });

  const removeFavorite = useMutation({
    mutationFn: (id: string) => userService.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (status === 'loading') {
    return <Skeleton height={200} radius={16} />;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in required</h1>
        <p className="mt-1 text-sm text-ink-soft">Please sign in to view and manage your profile.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">My profile</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>{user.email}</span>
          <span className="text-muted">· member since {formatDate(user.createdAt)}</span>
          <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'}>{user.role}</Badge>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Account details</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={profileForm.handleSubmit((values) => saveProfile.mutate(values))}
            noValidate
          >
            <Field
              label="Full name"
              htmlFor="pf-name"
              error={profileForm.formState.errors.name?.message}
            >
              <Input
                id="pf-name"
                {...profileForm.register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Too short' },
                })}
              />
            </Field>
            <Field label="Mobile" htmlFor="pf-mobile" hint="Optional.">
              <Input id="pf-mobile" {...profileForm.register('mobile')} />
            </Field>
            <Field label="Email" htmlFor="pf-email" hint="Email cannot be changed.">
              <Input id="pf-email" value={user.email} disabled />
            </Field>
            <div>
              <Button type="submit" loading={saveProfile.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Addresses</h2>
            <Button size="sm" variant="secondary" onClick={() => setEditingAddress('new')}>
              Add address
            </Button>
          </div>
          <div className="mt-4">
            {addresses.isLoading ? (
              <Skeleton height={80} radius={12} />
            ) : addresses.data && addresses.data.length ? (
              <div className="flex flex-col gap-3">
                {addresses.data.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-alt/40 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {address.label}
                        {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-soft">
                        {address.recipientName} · {address.phone}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-soft">
                        {address.addressLine1}
                        {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city},{' '}
                        {address.state} {address.postalCode}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address.id)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAddress.mutate(address.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No saved addresses yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Favorites</h2>
          <div className="mt-4">
            {favorites.isLoading ? (
              <Skeleton height={60} radius={12} />
            ) : favorites.data && favorites.data.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {favorites.data.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-alt/40 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">
                        {favorite.foodItemName ?? favorite.restaurantName ?? 'Saved item'}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-soft">
                        {favorite.foodItemName ? 'Dish' : 'Restaurant'} · saved{' '}
                        {formatDate(favorite.createdAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite.mutate(favorite.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No favorites yet"
                message="Save dishes and restaurants to find them quickly later."
              />
            )}
          </div>
        </section>
      </div>

      {editingAddress ? (
        <AddressModal
          addressId={editingAddress === 'new' ? undefined : editingAddress}
          initial={
            editingAddress === 'new'
              ? undefined
              : addresses.data?.find((address) => address.id === editingAddress)
          }
          onClose={() => setEditingAddress(null)}
          onSaved={() => {
            setEditingAddress(null);
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
          }}
        />
      ) : null}
    </div>
  );
}

function AddressModal({
  addressId,
  initial,
  onClose,
  onSaved,
}: {
  addressId?: string;
  initial?: Partial<AddressInput>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: initial?.label ?? '',
      recipientName: initial?.recipientName ?? '',
      phone: initial?.phone ?? '',
      addressLine1: initial?.addressLine1 ?? '',
      addressLine2: initial?.addressLine2 ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      postalCode: initial?.postalCode ?? '',
      isDefault: initial?.isDefault ?? false,
    },
  });

  const save = useMutation({
    mutationFn: (values: AddressValues) => {
      const payload: AddressInput = {
        ...values,
        addressLine2: values.addressLine2 || undefined,
      };
      return addressId
        ? userService.updateAddress(addressId, payload)
        : userService.createAddress(payload);
    },
    onSuccess: () => {
      toast.success(addressId ? 'Address updated' : 'Address added');
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not save address');
    },
  });

  return (
    <Modal
      open
      title={addressId ? 'Edit address' : 'Add address'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={form.handleSubmit((values) => save.mutate(values))}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="ad-label" error={form.formState.errors.label?.message}>
            <Input id="ad-label" placeholder="Home / Work" {...form.register('label')} />
          </Field>
          <Field
            label="Recipient name"
            htmlFor="ad-name"
            error={form.formState.errors.recipientName?.message}
          >
            <Input id="ad-name" {...form.register('recipientName')} />
          </Field>
        </div>
        <Field label="Phone" htmlFor="ad-phone" error={form.formState.errors.phone?.message}>
          <Input id="ad-phone" placeholder="+919876543210" {...form.register('phone')} />
        </Field>
        <Field
          label="Address line 1"
          htmlFor="ad-line1"
          error={form.formState.errors.addressLine1?.message}
        >
          <Input id="ad-line1" {...form.register('addressLine1')} />
        </Field>
        <Field label="Address line 2" htmlFor="ad-line2">
          <Input id="ad-line2" {...form.register('addressLine2')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="ad-city" error={form.formState.errors.city?.message}>
            <Input id="ad-city" {...form.register('city')} />
          </Field>
          <Field label="State" htmlFor="ad-state" error={form.formState.errors.state?.message}>
            <Input id="ad-state" {...form.register('state')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Postal code"
            htmlFor="ad-postal"
            error={form.formState.errors.postalCode?.message}
          >
            <Input id="ad-postal" {...form.register('postalCode')} />
          </Field>
          <Field label="Default address">
            <label className="flex items-center gap-2 pt-2 text-sm text-ink">
              <input type="checkbox" className="accent-primary" {...form.register('isDefault')} /> Use
              as default
            </label>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
