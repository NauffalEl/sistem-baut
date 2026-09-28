import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { updateProductSchema } from "@/lib/products/validation";
import { getProductById, updateProduct, checkSkuExists } from "@/lib/products/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check SKU uniqueness excluding current product
    if (body.sku && (await checkSkuExists(body.sku, id))) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json(
      { message: "Product updated successfully", product },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Product PATCH error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Product not found")) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
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
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Product GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error.message.includes("Product not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
