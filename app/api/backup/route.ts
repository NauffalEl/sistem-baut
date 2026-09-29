import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/security/error-handler";

export async function POST() {
  try {
    await requireRole("ADMIN");
    // Generate a simple JSON dump of core tables
    const [products, categories, suppliers, sales, purchases, inventory, stockMovements] = await Promise.all([
      prisma.product.findMany(),
      prisma.category.findMany(),
      prisma.supplier.findMany(),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.purchase.findMany({ include: { items: true } }),
      prisma.inventory.findMany(),
      prisma.stockMovement.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      products,
      categories,
      suppliers,
      sales,
      purchases,
      inventory,
      stockMovements,
    };

    const json = JSON.stringify(backupData, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
