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
  // Captured before the body is consumed, so the catch block can still mark the
  // receipt as failed.
  let pendingReceiptId: string | null = null;

  try {
    await requireRole("ADMIN");

    // Accept multipart/form-data with file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const existingReceiptId = formData.get("receiptId") as string | null;
    pendingReceiptId = existingReceiptId;

    if (!file && !existingReceiptId) {
      return NextResponse.json(
        { error: "file or receiptId required" },
        { status: 400 }
      );
    }

    // If uploading new file, convert to base64
    let base64Data: string | null = null;
    if (file) {
      const buffer = await file.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
    }

    // Create or use existing receipt
    let receipt;
    if (existingReceiptId) {
      const { getReceipt } = await import("@/lib/ocr/service");
      receipt = await getReceipt(existingReceiptId);
      if (!receipt) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
      }
    } else {
      const fileName = file?.name || `receipt-${Date.now()}.png`;
      receipt = await uploadReceipt(fileName, "");
      if (!base64Data) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
    }

    // Process OCR with base64 data
    if (!base64Data) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const result = await processReceipt(base64Data);

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
    // Update receipt status to failed if there's an error
    if (pendingReceiptId) {
      try {
        const { prisma } = await import("@/lib/db");
        const { getReceipt } = await import("@/lib/ocr/service");
        const receipt = await getReceipt(pendingReceiptId);
        if (receipt) {
          await prisma.receipt.update({
            where: { id: pendingReceiptId },
            data: { status: "failed" },
          });
        }
      } catch {
        // Never let bookkeeping hide the original error.
      }
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
