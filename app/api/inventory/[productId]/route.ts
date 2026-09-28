import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getStock, getStockHistory } from "@/lib/inventory/service";
import { stockHistorySchema } from "@/lib/inventory/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const stock = await getStock(productId);
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }
    return NextResponse.json({ stock });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { productId } = await params;
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = stockHistorySchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const history = await getStockHistory({ ...parsed.data, productId });
    return NextResponse.json(history);
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
