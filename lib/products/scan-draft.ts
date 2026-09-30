/**
 * sessionStorage key used to hand scanned receipt lines from products list to /products/new.
 */
export const PRODUCT_SCAN_DRAFT_KEY = "baut.product-scan-draft";

export type ProductScanDraftLine = {
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
};

export type ProductScanDraft = {
  receiptId: string;
  lines: ProductScanDraftLine[];
};

export function readProductScanDraft(): ProductScanDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PRODUCT_SCAN_DRAFT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PRODUCT_SCAN_DRAFT_KEY);
  try {
    const parsed = JSON.parse(raw) as ProductScanDraft;
    if (!parsed || typeof parsed.receiptId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProductScanDraft(draft: ProductScanDraft) {
  sessionStorage.setItem(PRODUCT_SCAN_DRAFT_KEY, JSON.stringify(draft));
}