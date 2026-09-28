import { describe, it, expect } from 'vitest';
import {
  createSaleSchema,
  saleSearchSchema,
} from '@/lib/sales/validation';

describe('Sale validation', () => {
  it('accept valid sale', () => {
    const data = {
      items: [
        { productId: 'prod-1', quantity: 5, price: 1000 },
        { productId: 'prod-2', quantity: 3, price: 500 },
      ],
      note: 'Test sale',
    };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject empty items', () => {
    const data = { items: [] };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject item with zero quantity', () => {
    const data = {
      items: [{ productId: 'prod-1', quantity: 0, price: 100 }],
    };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject negative price', () => {
    const data = {
      items: [{ productId: 'prod-1', quantity: 1, price: -100 }],
    };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accept sale search with defaults', () => {
    const data = {};
    const result = saleSearchSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accept sale search with all filters', () => {
    const data = {
      q: 'bolt',
      status: 'confirmed',
      page: 1,
      limit: 10,
    };
    const result = saleSearchSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject invalid status enum', () => {
    const data = { status: 'invalid' };
    const result = saleSearchSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
