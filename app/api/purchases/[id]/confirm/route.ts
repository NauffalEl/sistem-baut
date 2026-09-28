import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { confirmPurchase, cancelPurchase } from "@/lib/purchases/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const { action } = await req.json();

    if (action === "confirm") {
      await confirmPurchase(id);
      return NextResponse.json({ message: "Purchase confirmed" });
    }

    if (action === "cancel") {
      await cancelPurchase(id);
      return NextResponse.json({ message: "Purchase cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Purchase confirm/cancel error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    if (error.message.includes("Only draft")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
