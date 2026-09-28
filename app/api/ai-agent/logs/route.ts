import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getAIExecutionLogs } from "@/lib/ai/service";

export async function GET() {
  try {
    await requireAuth();
    const logs = await getAIExecutionLogs();
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("AI Logs GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
