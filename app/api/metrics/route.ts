import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getMetrics } from "@/lib/production/monitoring";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return getMetrics();
  } catch (error: any) {
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
