import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { processReceipt, uploadReceipt, listReceipts } from "@/lib/ocr/service";

export async function GET() {
  try {
    await requireAuth();
    const receipts = await listReceipts();
    return NextResponse.json({ receipts });
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

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { fileName, fileUrl } = await req.json();

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "fileName and fileUrl required" },
        { status: 400 }
      );
    }

    // Save receipt metadata
    const receipt = await uploadReceipt(fileName, fileUrl);

    // Process OCR
    const result = await processReceipt(fileUrl);

    // Save OCR result
    const { saveOCRResult } = await import("@/lib/ocr/service");
    await saveOCRResult(receipt.id, result);

    // Update receipt status
    const { prisma } = await import("@/lib/db");
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: "completed" },
    });

    return NextResponse.json({
      message: "Receipt processed",
      receipt,
      ocrResult: result,
    });
  } catch (error: any) {
    console.error("OCR POST error:", error);
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
