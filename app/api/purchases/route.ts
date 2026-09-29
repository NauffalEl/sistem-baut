import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/security/error-handler";
import { purchaseSearchSchema, createPurchaseSchema } from "@/lib/purchases/validation";
import { getPurchases, createPurchase } from "@/lib/purchases/service";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const url = req.nextUrl;
    const search = Object.fromEntries(url.searchParams.entries());
    const parsed = purchaseSearchSchema.safeParse(search);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await getPurchases(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error);
  }
}

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
    return NextResponse.json({ message: "Purchase created", purchase }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
