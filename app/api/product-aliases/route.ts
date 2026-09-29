import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { createProductAliasSchema } from "@/lib/products/validation";
import {
  createProductAlias,
  getProductAliases,
  deleteProductAlias,
} from "@/lib/products/service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "ID produk wajib diisi" }, { status: 400 });
    }
    const aliases = await getProductAliases(productId);
    return NextResponse.json({ aliases });
  } catch (error: any) {
    console.error("Product aliases GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = createProductAliasSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const alias = await createProductAlias({
      productId,
      alias: parsed.data.alias,
    });
    return NextResponse.json({ message: "Alias berhasil disimpan", alias }, { status: 201 });
  } catch (error: any) {
    console.error("Product alias POST error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menambah alias" },
        { status: 403 }
      );
    }
    if (String(error?.message || "").startsWith("Alias")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
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
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID alias wajib diisi" }, { status: 400 });
    }
    await deleteProductAlias(id);
    return NextResponse.json({ message: "Alias berhasil dihapus" });
  } catch (error: any) {
    console.error("Product alias DELETE error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menghapus alias" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
