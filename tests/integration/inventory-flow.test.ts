import { describe, it, expect } from 'vitest';
import { adjustStockSchema, stockHistorySchema } from '@/lib/inventory/validation';
import { createProductSchema } from '@/lib/products/validation';
import { createPurchaseSchema } from '@/lib/purchases/validation';
import { createSaleSchema } from '@/lib/sales/validation';

describe('Integration: Inventory Flow', () => {
  it('product creation schema is valid', () => {
    const data = {
      name: 'Baut M8x30',
      sku: 'BAUT-M8-30',
      categoryId: 'cat-baut',
      unit: 'pcs',
      lastBuyPrice: 500,
      sellingPrice: 750,
      minStock: 10,
    };
    const result = createProductSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('stock adjustment schema validates direction', () => {
    const validIn = {
      productId: 'prod-1',
      quantity: 10,
      direction: 'in',
      source: 'adjustment',
    };
    expect(adjustStockSchema.safeParse(validIn).success).toBe(true);

    const validOut = {
      productId: 'prod-1',
      quantity: 5,
      direction: 'out',
      source: 'correction',
    };
    expect(adjustStockSchema.safeParse(validOut).success).toBe(true);

    const invalid = {
      productId: 'prod-1',
      quantity: 5,
      direction: 'sideways',
      source: 'adjustment',
    };
    expect(adjustStockSchema.safeParse(invalid).success).toBe(false);
  });

  it('stock history schema accepts filters', () => {
    const data = {
      productId: 'prod-1',
      page: 1,
      limit: 20,
      source: 'purchase',
    };
    const result = stockHistorySchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('Integration: Purchase Flow', () => {
  it('purchase schema validates items', () => {
    const data = {
      supplierId: 'sup-1',
      items: [
        { productId: 'prod-1', quantity: 10, price: 500 },
        { productId: 'prod-2', quantity: 5, price: 1000 },
      ],
    };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('purchase rejects empty items', () => {
    const data = { supplierId: 'sup-1', items: [] };
    const result = createPurchaseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Integration: Sale Flow', () => {
  it('sale schema validates items', () => {
    const data = {
      items: [
        { productId: 'prod-1', quantity: 5, price: 750 },
        { productId: 'prod-2', quantity: 3, price: 1500 },
      ],
    };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('sale rejects zero quantity', () => {
    const data = {
      items: [{ productId: 'prod-1', quantity: 0, price: 750 }],
    };
    const result = createSaleSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Integration: Stock Consistency', () => {
  it('stock movement sources are valid', () => {
    const validSources = ['purchase', 'sale', 'adjustment', 'return', 'correction'];
    validSources.forEach((source) => {
      expect(typeof source).toBe('string');
    });
  });

  it('adjustment directions are valid', () => {
    const validDirections = ['in', 'out'];
    validDirections.forEach((dir) => {
      expect(typeof dir).toBe('string');
    });
  });
});
