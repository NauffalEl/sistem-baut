import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { adjustStock } from "@/lib/inventory/service";
import { adjustStockSchema } from "@/lib/inventory/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { productId } = await params;
    const body = await req.json();

    // Merge productId from body or params
    body.productId = body.productId ?? productId;

    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await adjustStock(parsed.data);
    return NextResponse.json({
      message: "Stock adjusted successfully",
      result,
    });
  } catch (error: any) {
    console.error("Inventory adjust error:", error);
    if (error.message === "Insufficient stock") {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
