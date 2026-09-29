"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

type Item = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: { name: string; sku: string };
};

type Sale = {
  id: string;
  saleNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  items: Item[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

const STATUS_LABEL: Record<string, string> = { draft: "Draft", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan" };

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { dialogProps, ask } = useConfirmDialog();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSale = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal memuat penjualan");
      }
      const d = await res.json();
      setSale(d.sale);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSale(); }, [fetchSale]);

  const handleAction = (action: "confirm" | "cancel") => {
    ask(
      action === "confirm" ? "Konfirmasi penjualan?" : "Batalkan penjualan?",
      async () => {
        try {
          const res = await fetch(`/api/sales/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Gagal");
            return;
          }
          await fetchSale();
        } catch {
          setError("Koneksi bermasalah");
        }
      },
      {
        description: action === "confirm" ? "Stok produk akan berkurang." : "Status diubah menjadi dibatalkan.",
        confirmLabel: action === "confirm" ? "Ya, Konfirmasi" : "Ya, Batalkan",
      }
    );
  };

  if (loading) return <div className="container"><p className="muted">Memuat data…</p></div>;
  if (error) return <div className="container"><p className="message error">{error}</p></div>;
  if (!sale) return <div className="container"><p className="muted">Penjualan tidak ditemukan.</p></div>;

  const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>{sale.saleNo}</h1>
          <p className="page-sub">
            {sale.status} • {new Date(sale.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/sales" className="btn-secondary">← Kembali</Link>
          {isAdmin && sale.status === "draft" && (
            <>
              <button onClick={() => handleAction("confirm")} className="btn-primary">Konfirmasi</button>
              <button onClick={() => handleAction("cancel")} className="btn-danger">Batalkan</button>
            </>
          )}
        </div>
      </div>

      {sale.note && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Catatan</span>
          <p style={{ marginTop: 4, fontSize: 13.5 }}>{sale.note}</p>
        </div>
      )}

      <div className="card">
        <h3>Rincian Penjualan</h3>
        <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Produk</th>
                <th className="num-col">SKU</th>
                <th className="num-col">Qty</th>
                <th className="num-col">Harga</th>
                <th className="num-col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="muted">{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{item.product.name}</td>
                  <td className="num">{item.product.sku}</td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{rupiah(item.price)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{rupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 14px 0", borderTop: "1px solid var(--line)", marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>{totalQty} item • {STATUS_LABEL[sale.status] ?? sale.status}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{rupiah(sale.total)}</span>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}