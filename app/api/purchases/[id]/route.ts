import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import {
  createPurchase,
  getPurchaseById,
  updatePurchase,
  confirmPurchase,
  cancelPurchase,
} from "@/lib/purchases/service";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
} from "@/lib/purchases/validation";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = createPurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const purchase = await createPurchase(parsed.data);
    return NextResponse.json(
      { message: "Purchase created", purchase },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Purchase POST error:", error);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const purchase = await updatePurchase(id, parsed.data);
    return NextResponse.json({
      message: "Purchase updated",
      purchase,
    });
  } catch (error: any) {
    console.error("Purchase PATCH error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const purchase = await getPurchaseById(id);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    return NextResponse.json({ purchase });
  } catch (error: any) {
    console.error("Purchase GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Confirm purchase
export async function POST_CONFIRM(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    await confirmPurchase(id);
    return NextResponse.json({ message: "Purchase confirmed" });
  } catch (error: any) {
    console.error("Purchase confirm error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    if (error.message.includes("Only draft")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
