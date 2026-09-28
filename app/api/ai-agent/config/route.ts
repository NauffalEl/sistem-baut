import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getCostControlConfig } from "@/lib/ai/cost-control";

export async function GET() {
  try {
    const config = getCostControlConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("AI Config GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    // In production, this would persist to DB or env
    process.env.AI_MAX_TOKENS = String(body.maxTokensPerRun);
    process.env.AI_MAX_COST_PER_RUN = String(body.maxCostPerRunUSD);
    process.env.AI_MAX_COST_PER_DAY = String(body.maxCostPerDayUSD);
    process.env.AI_MAX_CALLS_PER_HOUR = String(body.maxCallsPerHour);
    process.env.AI_TIMEOUT_MS = String(body.timeoutMs);

    const config = getCostControlConfig();
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("AI Config PATCH error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
