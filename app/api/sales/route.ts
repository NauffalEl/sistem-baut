import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { saleSearchSchema } from "@/lib/sales/validation";
import { getSales } from "@/lib/sales/service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = saleSearchSchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await getSales(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Sales GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
