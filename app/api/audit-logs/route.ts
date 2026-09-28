import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAuditLogs } from "@/lib/security/audit";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const url = req.nextUrl;
    const userId = url.searchParams.get("userId") || undefined;
    const entity = url.searchParams.get("entity") || undefined;
    const entityId = url.searchParams.get("entityId") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const logs = await getAuditLogs({ userId, entity, entityId, limit });
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Audit Logs GET error:", error);
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
