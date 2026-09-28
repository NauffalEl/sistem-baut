import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { checkStockConsistency } from "@/lib/inventory/service";

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const result = await checkStockConsistency(productId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Inventory check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
