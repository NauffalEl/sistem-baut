import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth/session";
import { getAllStocks, getLowStockProducts, getOutOfStockProducts } from "@/lib/inventory/service";

export async function GET() {
  try {
    await getCurrentUser();
    const stocks = await getAllStocks();
    return NextResponse.json({ stocks });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
