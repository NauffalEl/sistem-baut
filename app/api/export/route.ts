import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/security/error-handler";
import { prisma } from "@/lib/db";

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const type = req.nextUrl.searchParams.get("type");
    let rows: Record<string, any>[] = [];

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });
      rows = sales.flatMap((s) =>
        s.items.map((it) => ({
          saleNo: s.saleNo,
          status: s.status,
          tanggal: s.createdAt.toISOString().slice(0, 10),
          produk: it.product.name,
          sku: it.product.sku,
          qty: it.quantity,
          harga: it.price,
          subtotal: it.subtotal,
        }))
      );
    } else if (type === "purchases") {
      const purchases = await prisma.purchase.findMany({
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });
      rows = purchases.flatMap((p) =>
        p.items.map((it) => ({
          purchaseNo: p.purchaseNo,
          status: p.status,
          tanggal: p.createdAt.toISOString().slice(0, 10),
          supplier: p.supplier.name,
          produk: it.product.name,
          sku: it.product.sku,
          qty: it.quantity,
          harga: it.price,
          subtotal: it.subtotal,
        }))
      );
    } else if (type === "inventory") {
      const inv = await prisma.inventory.findMany({ include: { product: true } });
      rows = inv.map((i) => ({
        produk: i.product.name,
        sku: i.product.sku,
        kategori: i.product.categoryId,
        qty: i.quantity,
        minStock: i.product.minStock,
        hargaJual: i.product.sellingPrice,
      }));
    } else if (type === "products") {
      const products = await prisma.product.findMany({ include: { category: true } });
      rows = products.map((p) => ({
        nama: p.name,
        sku: p.sku,
        kategori: p.category?.name || "",
        hargaJual: p.sellingPrice,
        hargaBeli: p.lastBuyPrice,
        minStock: p.minStock,
        satuan: p.unit,
        aktif: p.active,
      }));
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const csv = toCSV(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
