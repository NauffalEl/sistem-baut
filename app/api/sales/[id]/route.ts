import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import {
  createSale,
  getSaleById,
  updateSale,
  confirmSale,
  cancelSale,
} from "@/lib/sales/service";
import { createSaleSchema, updateSaleSchema } from "@/lib/sales/validation";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const sale = await createSale(parsed.data);
    return NextResponse.json(
      { message: "Sale created", sale },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Sale POST error:", error);
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
    const parsed = updateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const sale = await updateSale(id, parsed.data);
    return NextResponse.json({
      message: "Sale updated",
      sale,
    });
  } catch (error: any) {
    console.error("Sale PATCH error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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
    const sale = await getSaleById(id);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json({ sale });
  } catch (error: any) {
    console.error("Sale GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
