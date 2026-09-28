import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { purchaseSearchSchema } from "@/lib/purchases/validation";
import { getPurchases } from "@/lib/purchases/service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = purchaseSearchSchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await getPurchases(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Purchases GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
