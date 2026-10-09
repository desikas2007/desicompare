'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { ApiError } from '@/lib/api-client';
import { loginSchema, registerSchema, LoginValues, RegisterValues } from '@/lib/validation';
import styles from './auth.module.css';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register: registerUser } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', mobile: '' },
  });

  async function onLogin(values: LoginValues) {
    setFormError(null);
    try {
      await login(values);
      router.push('/');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Sign in failed');
    }
  }

  async function onRegister(values: RegisterValues) {
    setFormError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        mobile: values.mobile || undefined,
      });
      router.push('/');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Registration failed');
    }
  }

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.card}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={[styles.tab, mode === 'login' ? styles.tabActive : ''].join(' ')}
            onClick={() => {
              setMode('login');
              setFormError(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={[styles.tab, mode === 'register' ? styles.tabActive : ''].join(' ')}
            onClick={() => {
              setMode('register');
              setFormError(null);
            }}
          >
            Create account
          </button>
        </div>

        {formError ? <p className={styles.error}>{formError}</p> : null}

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className={styles.form} noValidate>
            <h1 className={styles.heading}>Welcome back</h1>
            <Field label="Email" htmlFor="login-email" error={loginForm.formState.errors.email?.message}>
              <Input id="login-email" type="email" autoComplete="email" invalid={!!loginForm.formState.errors.email} {...loginForm.register('email')} />
            </Field>
            <Field label="Password" htmlFor="login-password" error={loginForm.formState.errors.password?.message}>
              <Input id="login-password" type="password" autoComplete="current-password" invalid={!!loginForm.formState.errors.password} {...loginForm.register('password')} />
            </Field>
            <Button type="submit" block loading={loginForm.formState.isSubmitting}>
              Sign in
            </Button>
            <p className={styles.hint}>
              Demo accounts: <code>demo@foodcompare.local</code> / <code>Demo@12345</code> ·{' '}
              <code>admin@foodcompare.local</code> / <code>Admin@12345</code>
            </p>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className={styles.form} noValidate>
            <h1 className={styles.heading}>Create your account</h1>
            <Field label="Full name" htmlFor="reg-name" error={registerForm.formState.errors.name?.message}>
              <Input id="reg-name" autoComplete="name" invalid={!!registerForm.formState.errors.name} {...registerForm.register('name')} />
            </Field>
            <Field label="Email" htmlFor="reg-email" error={registerForm.formState.errors.email?.message}>
              <Input id="reg-email" type="email" autoComplete="email" invalid={!!registerForm.formState.errors.email} {...registerForm.register('email')} />
            </Field>
            <Field label="Mobile (optional)" htmlFor="reg-mobile" error={registerForm.formState.errors.mobile?.message}>
              <Input id="reg-mobile" autoComplete="tel" placeholder="+919876543210" invalid={!!registerForm.formState.errors.mobile} {...registerForm.register('mobile')} />
            </Field>
            <Field
              label="Password"
              htmlFor="reg-password"
              hint="At least 8 characters."
              error={registerForm.formState.errors.password?.message}
            >
              <Input id="reg-password" type="password" autoComplete="new-password" invalid={!!registerForm.formState.errors.password} {...registerForm.register('password')} />
            </Field>
            <Button type="submit" block loading={registerForm.formState.isSubmitting}>
              Create account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
