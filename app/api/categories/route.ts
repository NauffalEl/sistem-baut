import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createCategorySchema } from "@/lib/products/validation";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "@/lib/products/service";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories GET error:", error);
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
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const category = await createCategory(parsed.data);
    return NextResponse.json(
      { message: "Category created", category },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Categories POST error:", error);
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
    const user = await requireRole("ADMIN");
    const { id, name } = await req.json();
    if (!id || typeof name !== "string" || name.length < 1) {
      return NextResponse.json(
        { error: "Missing id or name" },
        { status: 400 }
      );
    }
    const category = await updateCategory(id, name);
    return NextResponse.json({
      message: "Category updated",
      category,
    });
  } catch (error: any) {
    console.error("Categories PATCH error:", error);
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
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await deleteCategory(id);
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    console.error("Categories DELETE error:", error);
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