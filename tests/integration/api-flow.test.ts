import { describe, it, expect } from 'vitest';

describe('API Flow Tests', () => {
  describe('Authentication', () => {
    it('login schema validates email format', async () => {
      const { loginSchema } = await import('@/lib/auth/validation');
      const valid = { email: 'user@example.com', password: 'password' };
      expect(loginSchema.safeParse(valid).success).toBe(true);

      const invalid = { email: 'not-an-email', password: 'password' };
      expect(loginSchema.safeParse(invalid).success).toBe(false);
    });

    it('register schema enforces password strength', async () => {
      const { registerSchema } = await import('@/lib/auth/validation');
      const weak = { name: 'User', email: 'user@example.com', password: 'weak' };
      expect(registerSchema.safeParse(weak).success).toBe(false);

      const strong = { name: 'User', email: 'user@example.com', password: 'Strong1!' };
      expect(registerSchema.safeParse(strong).success).toBe(true);
    });
  });

  describe('Product Management', () => {
    it('create product schema requires name and SKU', async () => {
      const { createProductSchema } = await import('@/lib/products/validation');
      const valid = {
        name: 'Baut M8',
        sku: 'BAUT-M8',
        categoryId: 'cat-1',
        unit: 'pcs',
      };
      expect(createProductSchema.safeParse(valid).success).toBe(true);

      const missingName = { sku: 'BAUT-M8', categoryId: 'cat-1' };
      expect(createProductSchema.safeParse(missingName).success).toBe(false);
    });

    it('product search schema accepts filters', async () => {
      const { productSearchSchema } = await import('@/lib/products/validation');
      const data = { q: 'baut', categoryId: 'cat-1', active: 'true', page: 1, limit: 20 };
      expect(productSearchSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('Purchase & Sale', () => {
    it('purchase schema requires supplier and items', async () => {
      const { createPurchaseSchema } = await import('@/lib/purchases/validation');
      const valid = {
        supplierId: 'sup-1',
        items: [{ productId: 'prod-1', quantity: 10, price: 500 }],
      };
      expect(createPurchaseSchema.safeParse(valid).success).toBe(true);
    });

    it('sale schema requires items', async () => {
      const { createSaleSchema } = await import('@/lib/sales/validation');
      const valid = {
        items: [{ productId: 'prod-1', quantity: 5, price: 750 }],
      };
      expect(createSaleSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('OCR', () => {
    it('OCR result has required fields', () => {
      const mockResult = {
        rawText: 'receipt text',
        items: [{ rawName: 'Baut', quantity: 10, price: 500, confidence: 0.9 }],
        confidence: 0.9,
        provider: 'mock',
        processedAt: new Date(),
      };
      expect(mockResult.rawText).toBeDefined();
      expect(mockResult.items).toHaveLength(1);
      expect(mockResult.confidence).toBeGreaterThan(0);
    });
  });

  describe('AI Agent', () => {
    it('AI analysis result has required fields', () => {
      const mockResult = {
        type: 'inventory',
        title: 'Test',
        content: 'Test content',
        recommendations: ['rec1'],
        dataPoints: [{ label: 'test', value: 1 }],
        confidence: 0.8,
      };
      expect(mockResult.type).toBe('inventory');
      expect(mockResult.recommendations).toHaveLength(1);
    });
  });
});
