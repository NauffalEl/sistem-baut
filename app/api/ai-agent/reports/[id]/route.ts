import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { getAIReportById, updateAIReport } from "@/lib/ai/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const report = await getAIReportById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("AI Report GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const { status } = await req.json();
    const report = await updateAIReport(id, { status });
    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("AI Report PATCH error:", error);
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
