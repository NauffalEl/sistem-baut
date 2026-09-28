import { describe, it, expect } from 'vitest';
import {
  createPurchaseSchema,
  purchaseSearchSchema,
} from '@/lib/purchases/validation';

describe('Purchase validation', () => {
  it('accept valid purchase', () => {
    const data = {
      supplierId: 'sup-1',
      items: [
        { productId: 'prod-1', quantity: 10, price: 1000 },
        { productId: 'prod-2', quantity: 5, price: 500 },
      ],
      note: 'Test purchase',
    };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject missing supplierId', () => {
    const data = {
      items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
    };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject empty items', () => {
    const data = {
      supplierId: 'sup-1',
      items: [],
    };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject item with zero quantity', () => {
    const data = {
      supplierId: 'sup-1',
      items: [{ productId: 'prod-1', quantity: 0, price: 100 }],
    };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accept purchase search with defaults', () => {
    const data = {};
    const result = purchaseSearchSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accept purchase search with all filters', () => {
    const data = {
      q: 'bolt',
      supplierId: 'sup-1',
      status: 'confirmed',
      page: 1,
      limit: 10,
    };
    const result = purchaseSearchSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accept invalid status enum as error', () => {
    const data = { status: 'invalid' };
    const result = purchaseSearchSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
