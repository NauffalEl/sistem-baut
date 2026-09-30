import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const userInventories = await prisma.userInventory.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            minStock: true,
            aliases: { select: { alias: true } },
          },
        },
      },
    });

    const stocks = userInventories.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: {
        ...item.product,
        aliases: item.product.aliases.map((a) => a.alias),
      },
    }));

    return NextResponse.json({ stocks });
  } catch (error: unknown) {
    console.error("User inventory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}