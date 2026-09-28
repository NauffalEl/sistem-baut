import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  getAIAgentSettings,
  createAIAgentSettings,
  updateAIAgentSettings,
} from "@/lib/ai/service";

export async function GET() {
  try {
    const settings = await getAIAgentSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("AI Settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const settings = await createAIAgentSettings(body);
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("AI Settings POST error:", error);
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

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const settings = await updateAIAgentSettings(id, data);
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("AI Settings PATCH error:", error);
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
