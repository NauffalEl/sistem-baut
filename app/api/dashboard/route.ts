import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/service";

export async function GET() {
  try {
    await requireAuth();
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Dashboard GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
