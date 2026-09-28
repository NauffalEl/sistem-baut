import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '@/lib/ai/provider';

describe('AI Provider (Mock)', () => {
  const provider = new MockAIProvider();

  it('should have correct name', () => {
    expect(provider.name).toBe('mock');
  });

  it('should return inventory analysis for inventory prompt', async () => {
    const mockData = [
      { name: 'Baut M8', sku: 'BAUT-M8', minStock: 10, inventory: { quantity: 5 } },
      { name: 'Mur M8', sku: 'MUR-M8', minStock: 10, inventory: { quantity: 20 } },
      { name: 'Paku', sku: 'PAKU', minStock: 5, inventory: { quantity: 0 } },
    ];
    const result = await provider.analyze('inventory', mockData);
    expect(result.type).toBe('inventory');
    expect(result.title).toBe('Inventory Analysis');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should return sales analysis for sales prompt', async () => {
    const mockData = [
      { saleNo: 'SO-1', total: 50000, status: 'confirmed', createdAt: new Date().toISOString() },
      { saleNo: 'SO-2', total: 30000, status: 'confirmed', createdAt: new Date().toISOString() },
    ];
    const result = await provider.analyze('sales', mockData);
    expect(result.type).toBe('sales');
    expect(result.title).toBe('Sales Analysis');
  });

  it('should return weekly report for weekly prompt', async () => {
    const mockData = {
      products: [1, 2, 3, 4, 5],
      sales: [1, 2],
      purchases: [1],
    };
    const result = await provider.analyze('weekly report', mockData);
    expect(result.type).toBe('weekly');
    expect(result.title).toBe('Weekly Report');
  });

  it('should handle empty data gracefully', async () => {
    const result = await provider.analyze('inventory', []);
    expect(result.type).toBe('inventory');
    expect(result.recommendations).toBeDefined();
  });

  it('should return product analysis for product prompt', async () => {
    const mockData = [
      { name: 'Baut M8', sku: 'BAUT-M8', aliases: [{ alias: 'Bolt M8' }] },
      { name: 'Mur M8', sku: 'MUR-M8', aliases: [] },
    ];
    const result = await provider.analyze('product normalization', mockData);
    expect(result.type).toBe('product');
    expect(result.dataPoints.length).toBeGreaterThan(0);
  });
});
