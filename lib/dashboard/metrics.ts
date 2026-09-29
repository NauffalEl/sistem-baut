import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// Time-series metrics for charts
// ─────────────────────────────────────────────

export interface MetricsQuery {
  fromDate: Date;
  toDate: Date;
}

export interface TrendPoint {
  date: string;
  sales: number;
  purchase: number;
}

export interface CategoryStockData {
  category: string;
  quantity: number;
  percentage: number;
}

export interface TopProductData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  movement: number;
}

export interface DashboardMetrics {
  trends: TrendPoint[];
  categoryComposition: CategoryStockData[];
  topCategories: Array<{ category: string; total: number }>;
  topMovingProducts: TopProductData[];
}

export async function getDashboardMetrics(
  fromDate: Date,
  toDate: Date
): Promise<DashboardMetrics> {
  // ─────────────────────────────────────────────
  // Sales & Purchase Trends (per day)
  // ─────────────────────────────────────────────
  const sales = await prisma.sale.findMany({
    where: {
      status: "confirmed",
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
  });

  const purchases = await prisma.purchase.findMany({
    where: {
      status: "confirmed",
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
  });

  // Group by date and sum quantities
  const trendMap = new Map<string, { sales: number; purchase: number }>();

  sales.forEach((s) => {
    const dateStr = s.createdAt.toISOString().split("T")[0];
    const current = trendMap.get(dateStr) || { sales: 0, purchase: 0 };
    const totalQty = s.items.reduce((acc, item) => acc + item.quantity, 0);
    current.sales += totalQty;
    trendMap.set(dateStr, current);
  });

  purchases.forEach((p) => {
    const dateStr = p.createdAt.toISOString().split("T")[0];
    const current = trendMap.get(dateStr) || { sales: 0, purchase: 0 };
    const totalQty = p.items.reduce((acc, item) => acc + item.quantity, 0);
    current.purchase += totalQty;
    trendMap.set(dateStr, current);
  });

  // Sort by date
  const trends = Array.from(trendMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      purchase: data.purchase,
    }));

  // ─────────────────────────────────────────────
  // Category Composition (current stock)
  // ─────────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      inventory: true,
      category: { select: { name: true } },
    },
  });

  const categoryStockMap = new Map<string, number>();
  let totalStockAll = 0;

  products.forEach((p) => {
    const qty = p.inventory?.quantity || 0;
    const catName = p.category?.name || "Uncategorized";
    categoryStockMap.set(catName, (categoryStockMap.get(catName) || 0) + qty);
    totalStockAll += qty;
  });

  const categoryComposition = Array.from(categoryStockMap.entries())
    .map(([category, quantity]) => ({
      category,
      quantity,
      percentage:
        totalStockAll > 0 ? Math.round((quantity / totalStockAll) * 100) : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  // ─────────────────────────────────────────────
  // Top Categories (by total stock)
  // ─────────────────────────────────────────────
  const topCategories = categoryComposition.slice(0, 5);

  // ─────────────────────────────────────────────
  // Top Moving Products
  // ─────────────────────────────────────────────
  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          category: { select: { name: true } },
          inventory: true,
        },
      },
    },
  });

  const movementMap = new Map<
    string,
    { name: string; sku: string; category: string; totalMove: number }
  >();

  movements.forEach((m) => {
    const key = m.product.id;
    const current = movementMap.get(key) || {
      name: m.product.name,
      sku: m.product.sku,
      category: m.product.category?.name || "Uncategorized",
      totalMove: 0,
    };
    current.totalMove += Math.abs(m.quantity);
    movementMap.set(key, current);
  });

  const topMovingProducts = Array.from(movementMap.values())
    .map((item) => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity:
        products.find((p) => p.sku === item.sku)?.inventory?.quantity || 0,
      movement: item.totalMove,
    }))
    .sort((a, b) => b.movement - a.movement)
    .slice(0, 10);

  return {
    trends,
    categoryComposition,
    topCategories: topCategories.map((c) => ({
      category: c.category,
      total: c.quantity,
    })),
    topMovingProducts,
  };
}
