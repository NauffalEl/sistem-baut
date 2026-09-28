import { describe, it, expect, vi } from 'vitest';
import {
  isRateLimited,
  recordCall,
  getDailyCost,
  recordCost,
  sampleData,
  withTimeout,
  withRetry,
  getCostControlConfig,
} from '@/lib/ai/cost-control';

describe('Cost Control', () => {
  it('should return default config', () => {
    const config = getCostControlConfig();
    expect(config.maxTokensPerRun).toBe(4000);
    expect(config.timeoutMs).toBe(30000);
    expect(config.retryAttempts).toBe(2);
  });

  describe('Rate limiting', () => {
    it('should not be rate limited initially', () => {
      expect(isRateLimited('test-user')).toBe(false);
    });

    it('should allow recording calls', () => {
      recordCall('test-user');
      expect(isRateLimited('test-user')).toBe(false);
    });
  });

  describe('Daily cost', () => {
    it('should start at 0', () => {
      expect(getDailyCost()).toBe(0);
    });

    it('should track cost', () => {
      recordCost(0.5);
      expect(getDailyCost()).toBe(0.5);
    });

    it('should allow multiple cost recordings under limit', () => {
      recordCost(1.0);
      recordCost(1.0);
      expect(getDailyCost()).toBe(2.5);
    });
  });

  describe('Data sampling', () => {
    it('should return original data if within limit', () => {
      const smallData = { name: 'test' };
      const result = sampleData(smallData, 10000);
      expect(result).toEqual(smallData);
    });

    it('should sample large arrays', () => {
      const largeData = Array(1000).fill({ id: 1, name: 'test' });
      const result = sampleData(largeData, 100) as typeof largeData;
      expect(result.length).toBeLessThan(largeData.length);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should sample large objects', () => {
      const largeObj = {
        a: 'value1', b: 'value2', c: 'value3', d: 'value4', e: 'value5',
        f: 'value6', g: 'value7', h: 'value8', i: 'value9', j: 'value10',
      };
      const result = sampleData(largeObj, 50);
      const keys = Object.keys(result as object);
      expect(keys.length).toBeLessThan(10);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('Timeout', () => {
    it('should resolve quickly for fast operations', async () => {
      const fastFn = async () => 'done';
      const result = await withTimeout(fastFn(), 1000);
      expect(result).toBe('done');
    });

    it('should timeout for slow operations', async () => {
      const slowFn = async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return 'done';
      };
      await expect(withTimeout(slowFn(), 100)).rejects.toThrow('timed out');
    });
  });

  describe('Retry', () => {
    it('should succeed on first attempt', async () => {
      const successFn = vi.fn(() => Promise.resolve('success'));
      const result = await withRetry(successFn, 3);
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure then succeed', async () => {
      let attempts = 0;
      const fn = () => {
        attempts++;
        if (attempts < 3) return Promise.reject(new Error('fail'));
        return Promise.resolve('success');
      };
      const result = await withRetry(fn, 3);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const fn = () => Promise.reject(new Error('always fail'));
      await expect(withRetry(fn, 2)).rejects.toThrow('always fail');
    });
  });
});
