import { prisma } from "@/lib/db";
import { recordStockMovement } from "@/lib/inventory/service";
import {
  CreateSaleInput,
  UpdateSaleInput,
  SaleSearchInput,
} from "./validation";

// ─────────────────────────────────────────────
// Sale CRUD
// ─────────────────────────────────────────────

export async function createSale(data: CreateSaleInput) {
  // Generate sale number
  const count = await prisma.sale.count();
  const saleNo = `SO${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, "0")}`;

  return prisma.sale.create({
    data: {
      saleNo,
      status: "draft",
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

export async function getSales(search: SaleSearchInput) {
  const { q, status, page, limit } = search;
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [{ saleNo: { contains: q, mode: "insensitive" } }];
  }
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: { select: { id: true, quantity: true, price: true, subtotal: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateSale(id: string, data: UpdateSaleInput) {
  return prisma.sale.update({
    where: { id },
    data,
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

// ─────────────────────────────────────────────
// Confirm sale — deduct stock + create movement + price history
// ─────────────────────────────────────────────

export async function confirmSale(id: string, allowNegative: boolean = false) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "draft") throw new Error("Only draft sales can be confirmed");

  // Check all items have enough stock first
  for (const item of sale.items) {
    const inventory = await prisma.inventory.findUnique({ where: { productId: item.productId } });
    if (!inventory) throw new Error(`Inventory not found for product ${item.productId}`);
    if (inventory.quantity < item.quantity && !allowNegative) {
      throw new Error(
        `Insufficient stock for ${item.product.name}: have ${inventory.quantity}, need ${item.quantity}`
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    // Update status
    await tx.sale.update({ where: { id }, data: { status: "confirmed" } });

    for (const item of sale.items) {
      // Deduct stock
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          source: "sale",
          sourceId: id,
          note: `Sale ${sale.saleNo}`,
        },
      });

      // Update selling price on product
      if (item.price > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { sellingPrice: item.price },
        });
      }

      // Write price history
      await tx.priceHistory.create({
        data: {
          productId: item.productId,
          price: item.price,
          type: "selling",
          source: id,
          effectDate: new Date(),
        },
      });
    }

    return sale;
  });
}

// ─────────────────────────────────────────────
// Cancel sale — restore stock
// ─────────────────────────────────────────────

export async function cancelSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "draft") throw new Error("Only draft sales can be cancelled");

  return prisma.sale.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

// ─────────────────────────────────────────────
// Deposit calculation
// ─────────────────────────────────────────────

export async function calculateDeposit(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const total = sale.items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    saleNo: sale.saleNo,
    total,
    deposit: total, // In this version, deposit equals total (simplified)
  };
}

// ─────────────────────────────────────────────
// Add item to draft sale
// ─────────────────────────────────────────────

export async function addSaleItem(saleId: string, item: {
  productId: string;
  quantity: number;
  price: number;
}) {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "draft") throw new Error("Can only edit draft sales");

  const subtotal = item.quantity * item.price;
  return prisma.saleItem.create({
    data: {
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal,
    },
  });
}

// ─────────────────────────────────────────────
// Remove item from draft sale
// ─────────────────────────────────────────────

export async function removeSaleItem(itemId: string) {
  return prisma.saleItem.delete({ where: { id: itemId } });
}
