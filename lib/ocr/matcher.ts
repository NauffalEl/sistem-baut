import { prisma } from "@/lib/db";
import { OCRMatcher } from "./types";

/**
 * Match OCR item names to existing products using fuzzy matching.
 */
export class ProductMatcher implements OCRMatcher {
  async matchProduct(itemName: string): Promise<{
    productId: string;
    productName: string;
    confidence: number;
  } | null> {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { aliases: true },
    });

    let bestMatch: { productId: string; productName: string; confidence: number } | null = null;

    const normalizedItem = this.normalize(itemName);

    for (const product of products) {
      // Check product name
      const nameScore = this.similarity(normalizedItem, this.normalize(product.name));
      if (nameScore > 0.7 && (!bestMatch || nameScore > bestMatch.confidence)) {
        bestMatch = { productId: product.id, productName: product.name, confidence: nameScore };
      }

      // Check aliases
      for (const alias of product.aliases) {
        const aliasScore = this.similarity(normalizedItem, this.normalize(alias.alias));
        if (aliasScore > 0.7 && (!bestMatch || aliasScore > bestMatch.confidence)) {
          bestMatch = { productId: product.id, productName: product.name, confidence: aliasScore };
        }
      }
    }

    return bestMatch;
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  private similarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    const distance = this.levenshtein(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
