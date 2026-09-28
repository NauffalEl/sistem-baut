import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import {
  getReceipt,
  getOCRResults,
  updateOCRResult,
  createPurchaseFromOCR,
} from "@/lib/ocr/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireAuth();
    const { receiptId } = await params;
    const receipt = await getReceipt(receiptId);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }
    const ocrResults = await getOCRResults(receiptId);
    return NextResponse.json({ receipt, ocrResults });
  } catch (error: any) {
    console.error("OCR GET error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { receiptId } = await params;
    const body = await req.json();
    const { ocrResultId, productId, quantity, price, reviewed } = body;

    if (!ocrResultId) {
      return NextResponse.json(
        { error: "ocrResultId required" },
        { status: 400 }
      );
    }

    const updated = await updateOCRResult(ocrResultId, {
      productId,
      quantity,
      price,
      reviewed,
    });

    return NextResponse.json({
      message: "OCR result updated",
      ocrResult: updated,
    });
  } catch (error: any) {
    console.error("OCR PATCH error:", error);
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { receiptId } = await params;
    const { supplierId } = await req.json();

    if (!supplierId) {
      return NextResponse.json(
        { error: "supplierId required" },
        { status: 400 }
      );
    }

    const purchase = await createPurchaseFromOCR(receiptId, supplierId);
    return NextResponse.json({
      message: "Purchase created from OCR",
      purchase,
    });
  } catch (error: any) {
    console.error("OCR POST error:", error);
    if (error.message === "Requires ADMIN role") {
      return NextResponse.json(
        { error: "Unauthorized, ADMIN role required" },
        { status: 401 }
      );
    }
    if (error.message.includes("No reviewed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
