'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ApiError } from '@/lib/api-client';
import { loginSchema, LoginValues } from '@/lib/validation';

function safeNext(value: string | null): string {
  // Prevent open redirects: only allow same-origin absolute paths.
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) {
    return value;
  }
  return '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const next = safeNext(params.get('next'));

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values);
      router.replace(next);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Sign in failed. Please try again.');
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-7 shadow-md sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-soft">Sign in to continue to your dashboard.</p>

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
        <Field label="Email" htmlFor="login-email" error={form.formState.errors.email?.message}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="login-password" error={form.formState.errors.password?.message}>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
        </Field>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" block loading={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />}>
      <LoginForm />
    </Suspense>
  );
}
