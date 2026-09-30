import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const body = await req.json();
    const { productId, quantity, note } = body;
    if (!productId || !quantity || Number(quantity) <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const qty = Number(quantity);
    const general = await prisma.inventory.findUnique({
      where: { productId },
    });
    if (!general || general.quantity < qty) {
      return NextResponse.json({ error: "Insufficient general stock" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { productId },
        data: { quantity: { decrement: qty } },
      });

      const existing = await tx.userInventory.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      let userInv;
      if (existing) {
        userInv = await tx.userInventory.update({
          where: { userId_productId: { userId, productId } },
          data: { quantity: { increment: qty } },
        });
      } else {
        userInv = await tx.userInventory.create({
          data: { userId, productId, quantity: qty },
        });
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const count = await tx.userInventoryTransfer.count({
        where: {
          userId,
          productId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });
      const transfer = await tx.userInventoryTransfer.create({
        data: {
          userId,
          productId,
          quantity: qty,
          sequenceNumber: count + 1,
          note: note?.trim() || "Pengambilan dari gudang",
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity: qty,
          source: "adjustment",
          sourceId: transfer.id,
          note: `Pengambilan ke-${transfer.sequenceNumber} ke user ${user.name}`,
        },
      });

      return { userInv, transfer };
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: unknown) {
    console.error("User inventory transfer error:", error);
    if (error instanceof Error && error.message === "Insufficient general stock") {
      return NextResponse.json({ error: "Insufficient general stock" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}