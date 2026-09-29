import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/security/error-handler";
import { saleSearchSchema, createSaleSchema } from "@/lib/sales/validation";
import { getSales, createSale } from "@/lib/sales/service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = saleSearchSchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await getSales(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error);
  }
}

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
    return NextResponse.json({ message: "Sale created", sale }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
