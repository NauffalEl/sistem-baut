import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { registerSchema, loginSchema } from '@/lib/auth/validation';

describe('Password utilities', () => {
  it('hash and verify password', async () => {
    const pwd = 'TestPass123!';
    const hashed = await hashPassword(pwd);
    expect(typeof hashed).toBe('string');
    const ok = await verifyPassword(pwd, hashed);
    expect(ok).toBe(true);
  });
});

describe('Validation schemas', () => {
  it('accept valid registration data', () => {
    const data = { name: 'User', email: 'user@example.com', password: 'Strong1!' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject weak password', () => {
    const data = { name: 'User', email: 'user@example.com', password: 'weak' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accept valid login data', () => {
    const data = { email: 'user@example.com', password: 'any' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
