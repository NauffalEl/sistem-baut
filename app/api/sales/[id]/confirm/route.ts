import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { confirmSale, cancelSale, calculateDeposit } from "@/lib/sales/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === "confirm") {
      await confirmSale(id);
      return NextResponse.json({ message: "Sale confirmed" });
    }

    if (action === "cancel") {
      await cancelSale(id);
      return NextResponse.json({ message: "Sale cancelled" });
    }

    if (action === "deposit") {
      const result = await calculateDeposit(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Sale confirm/cancel error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    if (error.message.includes("Only draft")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message.includes("Insufficient stock")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
