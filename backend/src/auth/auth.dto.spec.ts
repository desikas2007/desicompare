import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  return validate(instance as object);
}

describe('auth DTO validation', () => {
  it('accepts a valid registration payload', async () => {
    const errors = await errorsFor(RegisterDto, {
      name: 'Aarav Sharma',
      email: 'Aarav@Example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    });
    expect(errors).toHaveLength(0);
  });

  it('normalizes email to lowercase', () => {
    const instance = plainToInstance(RegisterDto, {
      name: 'A',
      email: 'Aarav@Example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    });
    expect(instance.email).toBe('aarav@example.com');
  });

  it('rejects an invalid email address', async () => {
    const errors = await errorsFor(RegisterDto, {
      name: 'Aarav',
      email: 'not-an-email',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects weak passwords without a number', async () => {
    const errors = await errorsFor(RegisterDto, {
      name: 'Aarav',
      email: 'a@b.com',
      password: 'passwordonly',
      confirmPassword: 'passwordonly',
      acceptTerms: true,
    });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('requires terms acceptance', async () => {
    const errors = await errorsFor(RegisterDto, {
      name: 'Aarav',
      email: 'a@b.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: false,
    });
    expect(errors.some((e) => e.property === 'acceptTerms')).toBe(true);
  });

  it('validates login payloads', async () => {
    const ok = await errorsFor(LoginDto, { email: 'a@b.com', password: 'x' });
    expect(ok).toHaveLength(0);
    const bad = await errorsFor(LoginDto, { email: 'nope', password: '' });
    expect(bad.length).toBeGreaterThan(0);
  });
});
