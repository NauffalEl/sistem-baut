import { prisma } from "@/lib/db";
import { OCRResult, OCRItem } from "./types";
import { getOCRProvider } from "./provider";
import { ReceiptParser } from "./parser";
import { ProductMatcher } from "./matcher";

// ─────────────────────────────────────────────
// Process receipt image through OCR pipeline
// ─────────────────────────────────────────────

export async function processReceipt(imagePath: string): Promise<OCRResult> {
  const provider = getOCRProvider();
  const parser = new ReceiptParser();
  const matcher = new ProductMatcher();

  // Step 1: Extract text
  const rawText = await provider.extractText(imagePath);

  // Step 2: Parse items
  const parsedItems = parser.parseItems(rawText);

  // Step 3: Match products
  const items: OCRItem[] = await Promise.all(
    parsedItems.map(async (item) => {
      const match = await matcher.matchProduct(item.rawName);
      return {
        ...item,
        matchedProductId: match?.productId,
        matchedProductName: match?.productName,
        confidence: match
          ? (item.confidence + match.confidence) / 2
          : item.confidence * 0.5,
      };
    })
  );

  const avgConfidence =
    items.length > 0
      ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length
      : 0;

  return {
    rawText,
    items,
    confidence: avgConfidence,
    provider: provider.name,
    processedAt: new Date(),
  };
}

// ─────────────────────────────────────────────
// Save OCR result to database
// ─────────────────────────────────────────────

export async function saveOCRResult(
  receiptId: string,
  result: OCRResult
) {
  return prisma.oCRResult.create({
    data: {
      receiptId,
      rawText: result.rawText,
      quantity: result.items.reduce((sum, i) => sum + i.quantity, 0),
      price: result.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      confidence: result.confidence,
      reviewed: false,
    },
  });
}

// ─────────────────────────────────────────────
// Get OCR results for a receipt
// ─────────────────────────────────────────────

export async function getOCRResults(receiptId: string) {
  return prisma.oCRResult.findMany({
    where: { receiptId },
    include: { product: { select: { name: true, sku: true } } },
  });
}

// ─────────────────────────────────────────────
// Update OCR result (admin review)
// ─────────────────────────────────────────────

export async function updateOCRResult(
  id: string,
  data: {
    productId?: string;
    quantity?: number;
    price?: number;
    reviewed?: boolean;
  }
) {
  return prisma.oCRResult.update({
    where: { id },
    data,
  });
}

// ─────────────────────────────────────────────
// Create purchase from confirmed OCR result
// ─────────────────────────────────────────────

export async function createPurchaseFromOCR(
  receiptId: string,
  supplierId: string
) {
  const ocrResults = await prisma.oCRResult.findMany({
    where: { receiptId, reviewed: true },
    include: { product: true },
  });

  if (ocrResults.length === 0) {
    throw new Error("No reviewed OCR results found");
  }

  const items = ocrResults
    .filter((r) => r.productId)
    .map((r) => ({
      productId: r.productId!,
      quantity: r.quantity || 1,
      price: r.price || 0,
    }));

  if (items.length === 0) {
    throw new Error("No valid items to create purchase");
  }

  // Create purchase
  const purchase = await prisma.purchase.create({
    data: {
      purchaseNo: `PO-OCR-${Date.now().toString(36).toUpperCase()}`,
      supplierId,
      status: "confirmed",
      receiptId,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  // Update stock for each item
  for (const item of items) {
    await prisma.inventory.upsert({
      where: { productId: item.productId },
      update: { quantity: { increment: item.quantity } },
      create: { productId: item.productId, quantity: item.quantity },
    });

    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        source: "purchase",
        sourceId: purchase.id,
        note: `OCR Purchase ${purchase.purchaseNo}`,
      },
    });

    // Update price history
    await prisma.priceHistory.create({
      data: {
        productId: item.productId,
        price: item.price,
        type: "purchase",
        source: purchase.id,
        effectDate: new Date(),
      },
    });
  }

  // Mark receipt as confirmed
  await prisma.receipt.update({
    where: { id: receiptId },
    data: { status: "confirmed" },
  });

  return purchase;
}

// ─────────────────────────────────────────────
// Upload receipt file (mock - just save metadata)
// ─────────────────────────────────────────────

export async function uploadReceipt(fileName: string, fileUrl: string) {
  return prisma.receipt.create({
    data: {
      fileName,
      fileUrl,
      status: "pending",
    },
  });
}

// ─────────────────────────────────────────────
// Get receipt by ID
// ─────────────────────────────────────────────

export async function getReceipt(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: { ocrResults: true, purchases: true },
  });
}

// ─────────────────────────────────────────────
// List receipts
// ─────────────────────────────────────────────

export async function listReceipts(status?: string) {
  return prisma.receipt.findMany({
    where: status ? { status } : undefined,
    include: { ocrResults: true },
    orderBy: { createdAt: "desc" },
  });
}
