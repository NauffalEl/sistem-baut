import { describe, it, expect } from 'vitest';
import { ReceiptParser } from '@/lib/ocr/parser';
import { ProductMatcher } from '@/lib/ocr/matcher';

describe('ReceiptParser', () => {
  const parser = new ReceiptParser();

  it('parse simple receipt text', () => {
    const text = `
1. Baut M8x30    10 x 500    5000
2. Mur M8        20 x 200    4000
3. Paku 2"       15 x 300    4500
Total: 13500
    `.trim();

    const items = parser.parseItems(text);
    expect(items).toHaveLength(3);
    expect(items[0].rawName).toBe("Baut M8x30");
    expect(items[0].quantity).toBe(10);
    expect(items[0].price).toBe(500);
  });

  it('skip header and footer lines', () => {
    const text = `
TOKO BAUT JAYA
Jl. Raya No. 123
Tanggal: 2024-01-01

Baut M8 10 500 5000

Total: 5000
Terima kasih
    `.trim();

    const items = parser.parseItems(text);
    // Should only have the product line
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('handle line without number prefix', () => {
    const text = 'Baut M10x40 5 750 3750';
    const items = parser.parseItems(text);
    expect(items.length).toBe(1);
    expect(items[0].rawName).toBe('Baut M10x40');
  });
});

describe('ProductMatcher', () => {
  const matcher = new ProductMatcher();

  it('normalize removes special chars', () => {
    // Test internal normalize through similarity
    const result = (matcher as any).normalize('Baut M8 x 30');
    expect(result).toBe('bautm8x30');
  });

  it('exact match has highest similarity', () => {
    const sim = (matcher as any).similarity('bautm8x30', 'bautm8x30');
    expect(sim).toBe(1.0);
  });

  it('similar strings have high similarity', () => {
    const sim = (matcher as any).similarity('bautm8x30', 'bautm8x3');
    expect(sim).toBeGreaterThan(0.8);
  });

  it('different strings have low similarity', () => {
    const sim = (matcher as any).similarity('bautm8x30', 'murm10');
    expect(sim).toBeLessThan(0.5);
  });
});

describe('OCR error handling', () => {
  it('parse empty text returns empty array', () => {
    const parser = new ReceiptParser();
    const items = parser.parseItems('');
    expect(items).toHaveLength(0);
  });

  it('parse text with no items returns empty array', () => {
    const parser = new ReceiptParser();
    const items = parser.parseItems('Some header\nNo items here\nFooter');
    expect(items).toHaveLength(0);
  });
});
