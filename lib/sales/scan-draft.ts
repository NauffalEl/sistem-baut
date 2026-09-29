/**
 * sessionStorage key used to hand scanned receipt lines from /sales to /sales/new.
 * Kept in lib so both the list page and the form page share one definition.
 */
export const SCAN_DRAFT_KEY = "baut.sale-scan-draft";

export type ScanDraftLine = {
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
};

export type ScanDraft = {
  receiptId: string;
  lines: ScanDraftLine[];
};

export function readScanDraft(): ScanDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SCAN_DRAFT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(SCAN_DRAFT_KEY);
  try {
    const parsed = JSON.parse(raw) as ScanDraft;
    if (!parsed || typeof parsed.receiptId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeScanDraft(draft: ScanDraft) {
  sessionStorage.setItem(SCAN_DRAFT_KEY, JSON.stringify(draft));
}
