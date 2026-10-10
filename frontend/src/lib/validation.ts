import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Password is too long'),
  mobile: z
    .string()
    .regex(/^[+0-9\s-]{6,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: 'You must accept the Terms and Privacy Policy',
  }),
});

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(40),
  recipientName: z.string().min(1, 'Recipient name is required').max(120),
  phone: z.string().regex(/^[+0-9\s-]{6,20}$/, 'Enter a valid phone number'),
  addressLine1: z.string().min(3, 'Address is required').max(200),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(80),
  state: z.string().min(1, 'State is required').max(80),
  postalCode: z.string().min(3, 'Postal code is required').max(12),
  isDefault: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(72, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** Lightweight, explainable password-strength estimate for UI feedback only. */
export function scorePassword(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const clamped = Math.min(score, 4) as PasswordStrength['score'];
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score: clamped, label: labels[clamped] };
}
