import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getAllStocks, getLowStockProducts, getOutOfStockProducts } from "@/lib/inventory/service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = req.nextUrl.searchParams.get("userId");

    // Ringkasan inventori milik satu user — dipakai halaman detail inventori.
    if (userId) {
      if (userId !== user.id && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const [stocks, transfers] = await Promise.all([
        prisma.userInventory.findMany({
          where: { userId },
          include: { product: { select: { id: true, name: true, sku: true, minStock: true } } },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.userInventoryTransfer.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        stocks: stocks.map((s) => ({
          productId: s.productId,
          quantity: s.quantity,
          product: s.product,
        })),
        transfers,
      });
    }

    const stocks = await getAllStocks();
    return NextResponse.json({ stocks });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { action } = await req.json();

    if (action === "low-stock") {
      const products = await getLowStockProducts();
      return NextResponse.json({ products });
    }

    if (action === "out-of-stock") {
      const products = await getOutOfStockProducts();
      return NextResponse.json({ products });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
