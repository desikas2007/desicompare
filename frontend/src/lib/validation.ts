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

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
