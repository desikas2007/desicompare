'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, ForgotPasswordValues } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    // Always report success to avoid leaking which emails have accounts.
    try {
      await authService.forgotPassword(values.email);
    } finally {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-line bg-surface p-7 text-center shadow-md sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck size={22} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-soft">
          If an account exists for that email, we&apos;ve sent instructions to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-7 shadow-md sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter your account email and we&apos;ll send reset instructions.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="forgot-email" error={form.formState.errors.email?.message}>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            autoFocus
            invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>
        <Button type="submit" block loading={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
