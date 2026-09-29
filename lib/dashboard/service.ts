import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// Dashboard summary data
// ─────────────────────────────────────────────

export interface DashboardData {
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingPurchases: number;
  totalPurchases: number;
  totalPurchaseAmount: number;
  totalSales: number;
  totalSalesAmount: number;
  recentActivity: Array<{
    type: "purchase" | "sale" | "adjustment";
    product: string;
    sku: string;
    quantity: number;
    note: string;
    createdAt: string;
  }>;
  aiAgent: {
    enabled: boolean;
    scheduledEnabled: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
  } | null;
  latestReport: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    createdAt: Date;
  } | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  // Products
  const [totalProducts, activeProducts, lowStock, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true },
      include: { inventory: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { inventory: true },
    }),
  ]);

  // Stock
  const totalStock = await prisma.inventory.aggregate({
    _sum: { quantity: true },
  });

  // Low / Out of stock
  const lowStockProducts = lowStock.filter(
    (p) => p.inventory && p.inventory.quantity > 0 && p.inventory.quantity <= p.minStock
  );
  const outOfStockProducts = outOfStock.filter(
    (p) => !p.inventory || p.inventory.quantity <= 0
  );

  // Purchases
  const [pendingPurchases, allPurchases, purchaseSummary] = await Promise.all([
    prisma.purchase.count({ where: { status: "draft" } }),
    prisma.purchase.findMany({
      where: { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { supplier: { select: { name: true } } },
    }),
    prisma.purchase.aggregate({
      where: { status: "confirmed" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  // Sales
  const [allSales, salesSummary] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.sale.aggregate({
      where: { status: "confirmed" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  // Recent activity (stock movements)
  const recentMovements = await prisma.stockMovement.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, sku: true } } },
  });

  // AI Agent
  const aiAgentSettings = await prisma.aIAgentSettings.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // Latest AI report (read-only on the dashboard)
  const latestReport = await prisma.aIReport.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    totalProducts,
    activeProducts,
    totalStock: totalStock._sum.quantity || 0,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    pendingPurchases,
    totalPurchases: purchaseSummary._count || 0,
    totalPurchaseAmount: purchaseSummary._sum.total || 0,
    totalSales: salesSummary._count || 0,
    totalSalesAmount: salesSummary._sum.total || 0,
    recentActivity: recentMovements.map((m) => ({
      type: m.source as "purchase" | "sale" | "adjustment",
      product: m.product.name,
      sku: m.product.sku,
      quantity: Math.abs(m.quantity),
      note: m.note || "",
      createdAt: m.createdAt.toISOString(),
    })),
    aiAgent: aiAgentSettings
      ? {
          enabled: aiAgentSettings.enabled,
          scheduledEnabled: aiAgentSettings.scheduledEnabled,
          lastRun: aiAgentSettings.lastRun,
          nextRun: aiAgentSettings.nextRun,
        }
      : null,
    latestReport,
  };
}
