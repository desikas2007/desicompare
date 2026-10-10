'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Form';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import { resetPasswordSchema, ResetPasswordValues } from '@/lib/validation';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = form.watch('password');

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await authService.resetPassword(token, values.password);
      router.replace('/login?reset=1');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not reset password. The link may have expired.',
      );
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-line bg-surface p-7 text-center shadow-md sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle size={22} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Invalid reset link</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-7 shadow-md sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-soft">Make it strong and unique to this account.</p>

      {formError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Field
          label="New password"
          htmlFor="reset-password"
          error={form.formState.errors.password?.message}
        >
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            autoFocus
            invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <PasswordStrength password={password} />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="reset-confirm"
          error={form.formState.errors.confirmPassword?.message}
        >
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            invalid={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </Field>

        <Button type="submit" block loading={form.formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />}>
      <ResetForm />
    </Suspense>
  );
}
