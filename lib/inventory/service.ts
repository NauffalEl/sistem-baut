import { prisma } from "@/lib/db";
import {
  AdjustStockInput,
  StockHistoryInput,
} from "./validation";

// ─────────────────────────────────────────────
// Get stock
// ─────────────────────────────────────────────

export async function getStock(productId: string) {
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
    include: { product: { select: { name: true, sku: true, minStock: true } } },
  });
  return inventory;
}

export async function getAllStocks() {
  const items = await prisma.inventory.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true, minStock: true, active: true } },
    },
    orderBy: { product: { name: "asc" } },
  });
  return items;
}

// ─────────────────────────────────────────────
// Create inventory record for a product (lazy init)
// ─────────────────────────────────────────────

export async function ensureInventory(productId: string) {
  return prisma.inventory.upsert({
    where: { productId },
    update: {},
    create: { productId, quantity: 0 },
  });
}

// ─────────────────────────────────────────────
// Record stock movement (atomic)
// ─────────────────────────────────────────────

export async function recordStockMovement(params: {
  productId: string;
  quantity: number; // positive for in, negative for out
  source: "purchase" | "sale" | "adjustment" | "return" | "correction";
  sourceId?: string;
  note?: string;
  allowNegative?: boolean;
}) {
  const { productId, quantity, source, sourceId, note, allowNegative } = params;

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({ where: { productId } });
    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    const newQty = inventory.quantity + quantity;
    if (newQty < 0 && !allowNegative) {
      throw new Error("Insufficient stock");
    }

    const [updated, movement] = await Promise.all([
      tx.inventory.update({
        where: { productId },
        data: { quantity: newQty },
      }),
      tx.stockMovement.create({
        data: {
          productId,
          quantity,
          source,
          sourceId,
          note,
        },
      }),
    ]);

    return { inventory: updated, movement };
  });
}

// ─────────────────────────────────────────────
// Adjust stock (admin manual)
// ─────────────────────────────────────────────

export async function adjustStock(data: AdjustStockInput) {
  const qty = data.direction === "in" ? data.quantity : -data.quantity;
  return recordStockMovement({
    productId: data.productId,
    quantity: qty,
    source: data.source,
    note: data.note,
  });
}

// ─────────────────────────────────────────────
// Low stock / Out of stock detection
// ─────────────────────────────────────────────

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { inventory: true },
  });
  return products.filter(
    (p) => p.inventory && p.inventory.quantity <= p.minStock && p.inventory.quantity > 0
  );
}

export async function getOutOfStockProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { inventory: true },
  });
  return products.filter((p) => !p.inventory || p.inventory.quantity <= 0);
}

// ─────────────────────────────────────────────
// Stock history
// ─────────────────────────────────────────────

export async function getStockHistory(search: StockHistoryInput) {
  const { productId, page, limit, source } = search;
  const where: Record<string, unknown> = { productId };
  if (source) where.source = source;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─────────────────────────────────────────────
// Stock consistency check
// ─────────────────────────────────────────────

export async function checkStockConsistency(productId: string) {
  const movements = await prisma.stockMovement.findMany({
    where: { productId },
    select: { quantity: true },
  });
  const sum = movements.reduce((acc, m) => acc + m.quantity, 0);
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
    select: { quantity: true },
  });
  return {
    productId,
    calculated: sum,
    stored: inventory?.quantity ?? 0,
    consistent: sum === (inventory?.quantity ?? 0),
  };
}
