import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  createProductSchema,
  productSearchSchema,
} from "@/lib/products/validation";
import {
  createProduct,
  getProducts,
  deleteProduct,
  checkSkuExists,
} from "@/lib/products/service";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = productSearchSchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await getProducts(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Product search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const body = await req.json();

    // Check for SKU uniqueness
    if (body.sku && (await checkSkuExists(body.sku))) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await createProduct(parsed.data);
    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Product POST error:", error);
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
    const user = await requireRole("ADMIN");
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }
    const product = await deleteProduct(id);
    return NextResponse.json({ message: "Product deactivated", product });
  } catch (error: any) {
    console.error("Product DELETE error:", error);
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
