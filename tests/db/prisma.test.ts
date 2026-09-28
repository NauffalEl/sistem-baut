/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Connection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should execute raw query', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });
});

describe('User Model', () => {
  let roleId: string;
  let userId: string;

  beforeAll(async () => {
    const role = await prisma.role.create({
      data: { name: 'test-role-' + Date.now() },
    });
    roleId = role.id;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (roleId) await prisma.role.delete({ where: { id: roleId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should create user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-' + Date.now() + '@test.com',
        name: 'Test User',
        password: 'hashedpassword',
        roleId,
      },
    });
    userId = user.id;

    expect(user.id).toBeDefined();
    expect(user.email).toContain('@test.com');
    expect(user.active).toBe(true);
  });

  it('should find user by email', async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(user).toBeDefined();
    expect(user?.roleId).toBe(roleId);
  });
});

describe('Product Model', () => {
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'test-category-' + Date.now() },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (productId) await prisma.product.delete({ where: { id: productId } }).catch(() => {});
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should create product', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Bolt',
        sku: 'TEST-' + Date.now(),
        categoryId,
        unit: 'pcs',
      },
    });
    productId = product.id;

    expect(product.id).toBeDefined();
    expect(product.sku).toContain('TEST-');
    expect(product.active).toBe(true);
  });

  it('should create inventory for product', async () => {
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        quantity: 100,
      },
    });

    expect(inventory.productId).toBe(productId);
    expect(inventory.quantity).toBe(100);
  });
});

describe('Stock Movement', () => {
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'test-stock-category-' + Date.now() },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: 'Stock Test Product',
        sku: 'STOCK-TEST-' + Date.now(),
        categoryId,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.inventory.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } }).catch(() => {});
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should create stock movement', async () => {
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        quantity: 50,
        source: 'purchase',
        note: 'Initial stock',
      },
    });

    expect(movement.productId).toBe(productId);
    expect(movement.quantity).toBe(50);
    expect(movement.source).toBe('purchase');
  });

  it('should list stock movements for product', async () => {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    expect(movements.length).toBeGreaterThan(0);
  });
});

describe('AI Agent Models', () => {
  let settingsId: string;
  let executionId: string;
  let reportId: string;

  afterAll(async () => {
    if (reportId) await prisma.aIReport.delete({ where: { id: reportId } }).catch(() => {});
    if (executionId) await prisma.aIExecutionLog.delete({ where: { id: executionId } }).catch(() => {});
    if (settingsId) await prisma.aIAgentSettings.delete({ where: { id: settingsId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should create AI agent settings, execution log, and report', async () => {
    const settings = await prisma.aIAgentSettings.create({
      data: {
        enabled: true,
        scheduledEnabled: true,
        frequency: 'weekly',
      },
    });
    settingsId = settings.id;
    expect(settings.enabled).toBe(true);

    const log = await prisma.aIExecutionLog.create({
      data: {
        settingsId: settings.id,
        status: 'completed',
        tokensUsed: 1000,
        costUSD: 0.002,
      },
    });
    executionId = log.id;
    expect(log.status).toBe('completed');

    const report = await prisma.aIReport.create({
      data: {
        executionId: log.id,
        title: 'Weekly Inventory Report',
        content: '{"summary": "test"}',
        type: 'weekly',
      },
    });
    reportId = report.id;

    expect(report.executionId).toBe(executionId);
    expect(report.type).toBe('weekly');
    expect(report.status).toBe('generated');
  });
});
