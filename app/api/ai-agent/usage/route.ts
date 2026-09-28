import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getUsageStats } from "@/lib/ai/cost-control";

export async function GET() {
  try {
    await requireAuth();
    const stats = getUsageStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("AI Usage GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
