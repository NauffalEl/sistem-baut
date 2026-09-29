import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const entity = req.nextUrl.searchParams.get("entity");
    const entityId = req.nextUrl.searchParams.get("entityId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

    const where: any = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load audit logs" }, { status: 500 });
  }
}
