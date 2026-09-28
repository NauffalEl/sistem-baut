import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAIAgentSettings, runAIAnalysis, calculateNextRun } from "@/lib/ai/service";
import {
  isRateLimited,
  recordCall,
  recordCost,
  sampleData,
  withTimeout,
  withRetry,
  getCostControlConfig,
} from "@/lib/ai/cost-control";

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const { type } = await req.json();

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "inventory",
      "sales",
      "purchase",
      "price",
      "product",
      "weekly",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const settings = await getAIAgentSettings();
    if (!settings) {
      return NextResponse.json(
        { error: "AI Agent settings not found" },
        { status: 404 }
      );
    }

    // Check if AI is enabled
    if (!settings.enabled) {
      return NextResponse.json(
        { error: "AI Agent is disabled" },
        { status: 403 }
      );
    }

    // Rate limit check
    const config = getCostControlConfig();
    if (isRateLimited("admin")) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Max ${config.maxCallsPerHour} calls/hour.` },
        { status: 429 }
      );
    }

    // Sample data before sending to AI
    const sampledData = sampleData({});

    // Run with timeout and retry
    const result = await withRetry(async () => {
      return await withTimeout(
        runAIAnalysis(settings.id, type as any),
        config.timeoutMs
      );
    }, config.retryAttempts);

    // Record cost (estimate based on result)
    recordCost(0.1);
    recordCall("admin");

    // Update nextRun
    const nextRun = calculateNextRun(
      settings.frequency as any,
      settings.dayOfWeek,
      settings.timeOfDay
    );
    await requireRole("ADMIN");
    const { updateAIAgentSettings } = await import("@/lib/ai/service");
    await updateAIAgentSettings(settings.id, { nextRun });

    return NextResponse.json({
      message: "AI analysis completed",
      result,
      nextRun: nextRun.toISOString(),
    });
  } catch (error: any) {
    console.error("AI Run error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Rate limit")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error.message.includes("daily cost limit")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
