import { prisma } from "@/lib/db";
import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  PurchaseSearchInput,
  CreateSupplierInput,
} from "./validation";
import { recordStockMovement } from "@/lib/inventory/service";

// ─────────────────────────────────────────────
// Supplier CRUD
// ─────────────────────────────────────────────

export async function createSupplier(data: CreateSupplierInput) {
  return prisma.supplier.create({ data });
}

export async function getSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierInput>) {
  return prisma.supplier.update({ where: { id }, data });
}

export async function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } });
}

// ─────────────────────────────────────────────
// Purchase CRUD
// ─────────────────────────────────────────────

export async function createPurchase(data: CreatePurchaseInput) {
  // Generate purchase number automatically
  const count = await prisma.purchase.count();
  const purchaseNo = `PO${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, "0")}`;

  return prisma.purchase.create({
    data: {
      purchaseNo,
      supplierId: data.supplierId,
      status: "draft",
      note: data.note,
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
      supplier: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

export async function getPurchaseById(id: string) {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

export async function getPurchaseByNo(purchaseNo: string) {
  return prisma.purchase.findUnique({
    where: { purchaseNo },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function getPurchases(search: PurchaseSearchInput) {
  const { q, supplierId, status, page, limit } = search;
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { purchaseNo: { contains: q, mode: "insensitive" } },
      { supplier: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        items: { select: { id: true, quantity: true, price: true, subtotal: true, productId: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updatePurchase(id: string, data: UpdatePurchaseInput) {
  return prisma.purchase.update({
    where: { id },
    data,
    include: {
      supplier: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
}

// ─────────────────────────────────────────────
// Confirm purchase — increases stock + creates price history
// ─────────────────────────────────────────────

export async function confirmPurchase(id: string, allowNegative: boolean = false) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status !== "draft") throw new Error("Only draft purchases can be confirmed");

  return prisma.$transaction(async (tx) => {
    // Update status
    await tx.purchase.update({
      where: { id },
      data: { status: "confirmed" },
    });

    // Ensure inventory records exist and update stock
    for (const item of purchase.items) {
      // Upsert inventory
      await tx.inventory.upsert({
        where: { productId: item.productId },
        update: { quantity: { increment: item.quantity } },
        create: { productId: item.productId, quantity: item.quantity },
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          source: "purchase",
          sourceId: id,
          note: `Purchase ${purchase.purchaseNo}`,
        },
      });

      // Update lastBuyPrice on product
      if (item.price > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { lastBuyPrice: item.price },
        });
      }

      // Write price history
      await tx.priceHistory.create({
        data: {
          productId: item.productId,
          price: item.price,
          type: "purchase",
          source: id,
          effectDate: new Date(),
        },
      });
    }

    return purchase;
  });
}

// ─────────────────────────────────────────────
// Cancel purchase — revert any partial changes
// ─────────────────────────────────────────────

export async function cancelPurchase(id: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status !== "draft") throw new Error("Only draft purchases can be cancelled");

  return prisma.purchase.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

// ─────────────────────────────────────────────
// Add items to an existing draft purchase
// ─────────────────────────────────────────────

export async function addPurchaseItem(purchaseId: string, item: {
  productId: string;
  quantity: number;
  price: number;
}) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status !== "draft") throw new Error("Can only edit draft purchases");

  const subtotal = item.quantity * item.price;
  const created = await prisma.purchaseItem.create({
    data: {
      purchaseId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal,
    },
  });

  return created;
}

export async function removePurchaseItem(itemId: string) {
  return prisma.purchaseItem.delete({ where: { id: itemId } });
}

// ─────────────────────────────────────────────
// Purchase total calculation
// ─────────────────────────────────────────────

export async function calculatePurchaseTotal(items: Array<{ quantity: number; price: number }>) {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}
