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
import styles from './profile.module.css';

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
    return (
      <div className="container section stack">
        <Skeleton height={200} radius={18} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container section">
        <div className={styles.signInRequired}>
          <h1 className="section-title">Sign in required</h1>
          <p className="muted">Please sign in to view and manage your profile.</p>
          <Link href="/auth">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">My profile</h1>
      <p className="section-subtitle">
        {user.email} · member since {formatDate(user.createdAt)} ·{' '}
        <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'}>{user.role}</Badge>
      </p>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Account details</h2>
          <form
            className={styles.form}
            onSubmit={profileForm.handleSubmit((values) => saveProfile.mutate(values))}
            noValidate
          >
            <Field label="Full name" htmlFor="pf-name" error={profileForm.formState.errors.name?.message}>
              <Input id="pf-name" {...profileForm.register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} />
            </Field>
            <Field label="Mobile" htmlFor="pf-mobile" hint="Optional.">
              <Input id="pf-mobile" {...profileForm.register('mobile')} />
            </Field>
            <Field label="Email" htmlFor="pf-email" hint="Email cannot be changed.">
              <Input id="pf-email" value={user.email} disabled />
            </Field>
            <Button type="submit" loading={saveProfile.isPending}>Save changes</Button>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Addresses</h2>
            <Button size="sm" variant="secondary" onClick={() => setEditingAddress('new')}>
              Add address
            </Button>
          </div>
          {addresses.isLoading ? (
            <Skeleton height={80} radius={14} />
          ) : addresses.data && addresses.data.length ? (
            <div className={styles.addressList}>
              {addresses.data.map((address) => (
                <div key={address.id} className={styles.card}>
                  <div>
                    <div className={styles.cardName}>
                      {address.label} {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                    </div>
                    <div className={styles.cardLine}>
                      {address.recipientName} · {address.phone}
                    </div>
                    <div className={styles.cardLine}>
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city},{' '}
                      {address.state} {address.postalCode}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address.id)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAddress.mutate(address.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No saved addresses yet.</p>
          )}
        </section>

        <section className={styles.panel} style={{ gridColumn: '1 / -1' }}>
          <h2 className={styles.panelTitle}>Favorites</h2>
          {favorites.isLoading ? (
            <Skeleton height={60} radius={14} />
          ) : favorites.data && favorites.data.length ? (
            <div className={styles.favList}>
              {favorites.data.map((favorite) => (
                <div key={favorite.id} className={styles.card}>
                  <div>
                    <div className={styles.cardName}>
                      {favorite.foodItemName ?? favorite.restaurantName ?? 'Saved item'}
                    </div>
                    <div className={styles.cardLine}>
                      {favorite.foodItemName ? 'Dish' : 'Restaurant'} · saved {formatDate(favorite.createdAt)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFavorite.mutate(favorite.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No favorites yet" message="Save dishes and restaurants to find them quickly later." />
          )}
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
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={form.handleSubmit((values) => save.mutate(values))}>
            Save
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className="grid grid-2">
          <Field label="Label" htmlFor="ad-label" error={form.formState.errors.label?.message}>
            <Input id="ad-label" placeholder="Home / Work" {...form.register('label')} />
          </Field>
          <Field label="Recipient name" htmlFor="ad-name" error={form.formState.errors.recipientName?.message}>
            <Input id="ad-name" {...form.register('recipientName')} />
          </Field>
        </div>
        <Field label="Phone" htmlFor="ad-phone" error={form.formState.errors.phone?.message}>
          <Input id="ad-phone" placeholder="+919876543210" {...form.register('phone')} />
        </Field>
        <Field label="Address line 1" htmlFor="ad-line1" error={form.formState.errors.addressLine1?.message}>
          <Input id="ad-line1" {...form.register('addressLine1')} />
        </Field>
        <Field label="Address line 2" htmlFor="ad-line2">
          <Input id="ad-line2" {...form.register('addressLine2')} />
        </Field>
        <div className="grid grid-2">
          <Field label="City" htmlFor="ad-city" error={form.formState.errors.city?.message}>
            <Input id="ad-city" {...form.register('city')} />
          </Field>
          <Field label="State" htmlFor="ad-state" error={form.formState.errors.state?.message}>
            <Input id="ad-state" {...form.register('state')} />
          </Field>
        </div>
        <div className="grid grid-2">
          <Field label="Postal code" htmlFor="ad-postal" error={form.formState.errors.postalCode?.message}>
            <Input id="ad-postal" {...form.register('postalCode')} />
          </Field>
          <Field label="Default address">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <input type="checkbox" {...form.register('isDefault')} /> Use as default
            </label>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
