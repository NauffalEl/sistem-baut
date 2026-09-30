import { OCRItem, OCRParser } from "./types";

/**
 * Parse OCR text into structured items.
 * Handles common receipt formats.
 */
export class ReceiptParser implements OCRParser {
  parseItems(rawText: string): OCRItem[] {
    const lines = rawText.split("\n");
    const items: OCRItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip header/footer lines
      if (this.isHeaderOrFooter(trimmed)) continue;

      const item = this.parseLine(trimmed);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private isHeaderOrFooter(line: string): boolean {
    const skipPatterns = [
      /^TOKO/i,
      /^Jl\./i,
      /^Telp/i,
      /^Tanggal/i,
      /^No[:.]/i,
      /^Total/i,
      /^Tunai/i,
      /^Kembali/i,
      /^Terima kasih/i,
      /^===/,
      /^---/,
    ];
    return skipPatterns.some((p) => p.test(line));
  }

  private parseLine(line: string): OCRItem | null {
    // Pattern: "1. Product Name    10 x 500    5000"
    // or: "Product Name  10  500  5000"
    const patterns = [
      // Numbered: "1. Name  qty x price  total"
      /^\d+\.\s+(.+?)\s+(\d+)\s*x\s*(\d+)\s+(\d+)$/,
      // Simple: "Name  qty  price  total"
      /^(.+?)\s+(\d+)\s+(\d+)\s+(\d+)$/,
      // Qty first: "qty Name price" (User's example: 500 Baut 6x30 700)
      /^(\d+)\s+(.+?)\s+(\d+)$/,
      // With spaces: "Name  qty x price"
      /^(.+?)\s+(\d+)\s*x\s*(\d+)$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let rawName, qty, price, total;

        if (pattern.source.startsWith("^(\\d+)")) {
          // Qty first pattern: [qty, name, price]
          [, qty, rawName, price] = match;
          total = undefined;
        } else if (pattern.source.includes("x") && match.length === 5) {
           // Numbered pattern: [full, name, qty, price, total]
           [, rawName, qty, price, total] = match;
        } else if (match.length === 5) {
           // Simple 4-col: [full, name, qty, price, total]
           [, rawName, qty, price, total] = match;
        } else {
           // Simple 3-col: [full, name, qty, price]
           [, rawName, qty, price] = match;
           total = undefined;
        }

        const quantity = parseInt(qty, 10);
        const unitPrice = parseInt(price, 10);
        const lineTotal = total ? parseInt(total, 10) : quantity * unitPrice;

        return {
          rawName: rawName.trim(),
          quantity,
          price: unitPrice,
          confidence: this.calculateConfidence(rawName, quantity, unitPrice, lineTotal),
        };
      }
    }

    return null;
  }

  private calculateConfidence(name: string, qty: number, price: number, total: number): number {
    let score = 0.5;

    // Name length reasonable
    if (name.length > 2 && name.length < 100) score += 0.1;

    // Quantity reasonable
    if (qty > 0 && qty < 10000) score += 0.1;

    // Price reasonable
    if (price > 0 && price < 10000000) score += 0.1;

    // Total matches
    if (total === qty * price) score += 0.2;

    return Math.min(score, 1.0);
  }
}
