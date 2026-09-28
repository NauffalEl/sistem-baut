import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getAIReports } from "@/lib/ai/service";

export async function GET() {
  try {
    await requireAuth();
    const reports = await getAIReports();
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("AI Reports GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
