'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { ApiError } from '@/lib/api-client';
import { registerSchema, RegisterValues } from '@/lib/validation';

const SIGN_IN_URL = '/login?registered=1';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, logout } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => router.replace(SIGN_IN_URL), 3000);
    return () => window.clearTimeout(timer);
  }, [submitted, router]);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      acceptedTerms: false,
    },
  });

  const password = form.watch('password');
  const termsError = form.formState.errors.acceptedTerms?.message;

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        mobile: values.mobile || undefined,
        acceptTerms: values.acceptedTerms,
      });
      try {
        // Registration succeeds server-side; sign the temporary session out so
        // the user completes the intended "sign in" flow on the login page.
        await logout();
      } catch {
        // Best-effort: the account is already created.
      }
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Registration failed. Please try again.',
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-line bg-surface p-7 text-center shadow-md sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 size={22} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Account created successfully</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Your account is ready. Sign in with your new credentials to start comparing prices.
        </p>
        <Link
          href={SIGN_IN_URL}
          className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Go to sign in
        </Link>
        <p className="mt-4 text-xs text-muted" aria-live="polite">
          Redirecting to the sign-in page…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-7 shadow-md sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Start comparing delivered prices in seconds.</p>

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
        <Field label="Full name" htmlFor="reg-name" error={form.formState.errors.name?.message}>
          <Input
            id="reg-name"
            autoComplete="name"
            autoFocus
            invalid={!!form.formState.errors.name}
            {...form.register('name')}
          />
        </Field>

        <Field label="Email" htmlFor="reg-email" error={form.formState.errors.email?.message}>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>

        <Field
          label="Mobile (optional)"
          htmlFor="reg-mobile"
          error={form.formState.errors.mobile?.message}
        >
          <Input
            id="reg-mobile"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            invalid={!!form.formState.errors.mobile}
            {...form.register('mobile')}
          />
        </Field>

        <Field label="Password" htmlFor="reg-password" error={form.formState.errors.password?.message}>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <PasswordStrength password={password} />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="reg-confirm"
          error={form.formState.errors.confirmPassword?.message}
        >
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            invalid={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            aria-invalid={!!termsError}
            {...form.register('acceptedTerms')}
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="font-medium text-primary hover:text-primary-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-primary hover:text-primary-dark">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {termsError ? (
          <span role="alert" className="-mt-2 text-xs text-danger">
            {termsError}
          </span>
        ) : null}

        <Button type="submit" block loading={form.formState.isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
