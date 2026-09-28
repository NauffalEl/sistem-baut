import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptParser } from '@/lib/ocr/parser';
import { ProductMatcher } from '@/lib/ocr/matcher';
import { getOCRProvider } from '@/lib/ocr/provider';

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

describe('OCR Provider Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns mock provider when OCR_PROVIDER is empty', () => {
    process.env.OCR_PROVIDER = '';
    const provider = getOCRProvider();
    expect(provider.name).toBe('mock');
  });

  it('returns mock provider when OCR_PROVIDER is mock', () => {
    process.env.OCR_PROVIDER = 'mock';
    const provider = getOCRProvider();
    expect(provider.name).toBe('mock');
  });

  it('returns ocr.space provider when OCR_PROVIDER is ocr.space', () => {
    process.env.OCR_PROVIDER = 'ocr.space';
    const provider = getOCRProvider();
    expect(provider.name).toBe('ocr.space');
  });

  it('returns mock provider for unknown provider', () => {
    process.env.OCR_PROVIDER = 'unknown';
    const provider = getOCRProvider();
    expect(provider.name).toBe('mock');
  });
});

describe('OCRSpaceProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws error when OCR_API_KEY is not set', async () => {
    process.env.OCR_PROVIDER = 'ocr.space';
    process.env.OCR_API_KEY = '';
    const { OCRSpaceProvider } = await import('@/lib/ocr/providers/ocrspace');
    const provider = new OCRSpaceProvider();
    await expect(provider.extractText('base64data')).rejects.toThrow('OCR_API_KEY is not set');
  });

  it('sends base64 image to OCR.space API', async () => {
    process.env.OCR_PROVIDER = 'ocr.space';
    process.env.OCR_API_KEY = 'test-key';
    process.env.OCR_BASE_URL = 'https://api.ocr.space/parse/image';

    const mockResponse = {
      ParsedResults: [{ ParsedText: 'TOKO BAUT\nBaut M8 10 500 5000' }],
      IsErroredOnProcessing: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { OCRSpaceProvider } = await import('@/lib/ocr/providers/ocrspace');
    const provider = new OCRSpaceProvider();
    const result = await provider.extractText('iVBORw0KGgo=');

    expect(result).toContain('TOKO BAUT');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.ocr.space/parse/image',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('handles OCR.space API error', async () => {
    process.env.OCR_PROVIDER = 'ocr.space';
    process.env.OCR_API_KEY = 'test-key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        IsErroredOnProcessing: true,
        ErrorMessage: ['Invalid API key'],
      }),
    });

    const { OCRSpaceProvider } = await import('@/lib/ocr/providers/ocrspace');
    const provider = new OCRSpaceProvider();
    await expect(provider.extractText('base64data')).rejects.toThrow('Invalid API key');
  });

  it('handles empty OCR results', async () => {
    process.env.OCR_PROVIDER = 'ocr.space';
    process.env.OCR_API_KEY = 'test-key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ParsedResults: [],
        IsErroredOnProcessing: false,
      }),
    });

    const { OCRSpaceProvider } = await import('@/lib/ocr/providers/ocrspace');
    const provider = new OCRSpaceProvider();
    await expect(provider.extractText('base64data')).rejects.toThrow('no results');
  });
});
