import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/auth/validation';
import { AppError, handleApiError } from '@/lib/security/error-handler';
import { isRateLimited, getRateLimitHeaders } from '@/lib/security/rate-limit';

describe('Security', () => {
  describe('Input validation', () => {
    it('register rejects weak password', () => {
      const data = { name: 'User', email: 'user@example.com', password: 'weak' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('register rejects invalid email', () => {
      const data = { name: 'User', email: 'invalid', password: 'Strong1!' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('register rejects empty name', () => {
      const data = { name: '', email: 'user@example.com', password: 'Strong1!' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('AppError has statusCode and message', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('handleApiError returns correct response for AppError', async () => {
      const error = new AppError('Bad request', 400);
      const response = handleApiError(error);
      expect(response.status).toBe(400);
    });

    it('handleApiError returns 500 for unknown errors', async () => {
      const error = new Error('Unknown error');
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });
  });

  describe('Rate limiting', () => {
    it('returns false for first request', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
        nextUrl: { pathname: '/api/test' },
      } as any;
      expect(isRateLimited(mockReq, { windowMs: 1000, maxRequests: 5 })).toBe(false);
    });

    it('returns true when limit exceeded', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.2']]),
        nextUrl: { pathname: '/api/test' },
      } as any;
      // Exceed limit
      for (let i = 0; i < 10; i++) {
        isRateLimited(mockReq, { windowMs: 1000, maxRequests: 5 });
      }
      expect(isRateLimited(mockReq, { windowMs: 1000, maxRequests: 5 })).toBe(true);
    });

    it('returns rate limit headers', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.3']]),
        nextUrl: { pathname: '/api/test' },
      } as any;
      const headers = getRateLimitHeaders(mockReq);
      expect(headers).toHaveProperty('X-RateLimit-Limit');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
    });
  });
});
