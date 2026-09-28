import { describe, it, expect } from 'vitest';
import { adjustStockSchema, stockHistorySchema } from '@/lib/inventory/validation';

describe('Inventory validation', () => {
  it('accept valid adjustment (in)', () => {
    const data = {
      productId: 'prod-1',
      quantity: 10,
      direction: 'in',
      source: 'adjustment',
      note: 'Restock',
    };
    const result = adjustStockSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accept valid adjustment (out)', () => {
    const data = {
      productId: 'prod-1',
      quantity: 5,
      direction: 'out',
      source: 'correction',
    };
    const result = adjustStockSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject zero quantity', () => {
    const data = {
      productId: 'prod-1',
      quantity: 0,
      direction: 'in',
      source: 'adjustment',
    };
    const result = adjustStockSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject invalid direction', () => {
    const data = {
      productId: 'prod-1',
      quantity: 5,
      direction: 'sideways',
      source: 'adjustment',
    };
    const result = adjustStockSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('reject invalid source', () => {
    const data = {
      productId: 'prod-1',
      quantity: 5,
      direction: 'in',
      source: 'magic',
    };
    const result = adjustStockSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accept valid stock history query', () => {
    const data = {
      productId: 'prod-1',
      page: 1,
      limit: 20,
      source: 'purchase',
    };
    const result = stockHistorySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reject missing productId in history', () => {
    const data = {
      page: 1,
      limit: 20,
    };
    const result = stockHistorySchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
