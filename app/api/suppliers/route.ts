import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupplierSchema } from "@/lib/purchases/validation";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} from "@/lib/purchases/service";

export async function GET() {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Suppliers GET error:", error);
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
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const supplier = await createSupplier(parsed.data);
    return NextResponse.json(
      { message: "Supplier created", supplier },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Supplier POST error:", error);
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
    const supplier = await updateSupplier(id, data);
    return NextResponse.json({ message: "Supplier updated", supplier });
  } catch (error: any) {
    console.error("Supplier PATCH error:", error);
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

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await deleteSupplier(id);
    return NextResponse.json({ message: "Supplier deleted" });
  } catch (error: any) {
    console.error("Supplier DELETE error:", error);
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
