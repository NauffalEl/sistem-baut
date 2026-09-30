import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ProductMatcher } from "@/lib/ocr/matcher";

type ResolveBody = { names?: string[] };

/**
 * Resolves scanned item names to products using the same matcher the OCR
 * pipeline uses, so /products review and /sales never disagree on a match.
 * Returns the product's current selling price so the reviewer can see the
 * delta between the scanned price and the stored one.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = (await req.json()) as ResolveBody;
    const names = Array.isArray(body.names) ? body.names : [];

    if (names.length === 0) {
      return NextResponse.json({ matches: [] });
    }
    if (names.length > 100) {
      return NextResponse.json(
        { error: "Maksimal 100 nama per permintaan" },
        { status: 400 }
      );
    }

    const matcher = new ProductMatcher();
    const matches = await Promise.all(
      names.map(async (name) => {
        const match = await matcher.matchProduct(name);
        if (!match) return { name, product: null };
        const product = await prisma.product.findUnique({
          where: { id: match.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            aliases: { select: { alias: true } },
          },
        });
        return { name, product, confidence: match.confidence };
      })
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("OCR match resolve error:", error);
    if (error instanceof Error && error.message === "Requires ADMIN role") {
      return NextResponse.json({ error: "Unauthorized, ADMIN role required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}