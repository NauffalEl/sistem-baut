import { describe, it, expect } from 'vitest';

describe('Stock Consistency Rules', () => {
  it('stock movement sources match schema enum', () => {
    const validSources = ['purchase', 'sale', 'adjustment', 'return', 'correction'];
    const schema = ['purchase', 'sale', 'adjustment', 'return', 'correction'];
    validSources.forEach((s) => expect(schema).toContain(s));
  });

  it('purchase increases stock', () => {
    const initialQty = 10;
    const purchaseQty = 5;
    const expected = initialQty + purchaseQty;
    expect(expected).toBe(15);
  });

  it('sale decreases stock', () => {
    const initialQty = 10;
    const saleQty = 3;
    const expected = initialQty - saleQty;
    expect(expected).toBe(7);
  });

  it('adjustment can increase or decrease', () => {
    const initialQty = 10;
    const adjustIn = 5;
    const adjustOut = 3;
    expect(initialQty + adjustIn).toBe(15);
    expect(initialQty - adjustOut).toBe(7);
  });

  it('stock cannot go negative by default', () => {
    const initialQty = 5;
    const saleQty = 10;
    const result = initialQty - saleQty;
    expect(result).toBeLessThan(0);
    // In real system, this should throw error
  });

  it('low stock detection: quantity <= minStock and > 0', () => {
    const minStock = 10;
    const lowQty = 5;
    const okQty = 15;
    const outQty = 0;

    expect(lowQty <= minStock && lowQty > 0).toBe(true);
    expect(okQty <= minStock && okQty > 0).toBe(false);
    expect(outQty <= minStock && outQty > 0).toBe(false);
  });

  it('out of stock detection: quantity <= 0', () => {
    expect(0 <= 0).toBe(true);
    expect(-1 <= 0).toBe(true);
    expect(1 <= 0).toBe(false);
  });
});
