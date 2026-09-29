"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";

type Movement = {
  id: string;
  quantity: number;
  source: string;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string };
};

type Stock = {
  id: string;
  quantity: number;
  product: { name: string; sku: string; minStock: number };
};

const SOURCE_LABEL: Record<string, string> = {
  purchase: "Pembelian",
  sale: "Penjualan",
  adjustment: "Penyesuaian",
  return: "Retur",
  correction: "Koreksi",
};

const sourceLabel = (s: string) => SOURCE_LABEL[s] ?? s;

export default function StockHistoryPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const [stock, setStock] = useState<Stock | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stockRes, histRes] = await Promise.all([
        fetch(`/api/inventory/${productId}`, { cache: "no-store" }),
        fetch(`/api/inventory/${productId}?page=1&limit=50`, { cache: "no-store" }),
      ]);
      if (!stockRes.ok) throw new Error("Gagal memuat data stok");
      if (!histRes.ok) throw new Error("Gagal memuat riwayat stok");

      const stockData = await stockRes.json();
      setStock(stockData.stock);

      const histData = await histRes.json();
      setMovements(histData.items || []);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="container"><p className="muted">Memuat data…</p></div>;
  if (error) return <div className="container"><p className="message error">{error}</p></div>;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Riwayat Stok</h1>
          {stock && (
            <p className="page-sub">
              {stock.product.name} ({stock.product.sku}) — stok saat ini: {stock.quantity}
            </p>
          )}
        </div>
        <Link href="/inventory" className="btn-secondary">
          ← Kembali ke Inventori
        </Link>
      </div>

      {movements.length === 0 ? (
        <div className="card empty-state">Belum ada riwayat pergerakan stok untuk produk ini.</div>
      ) : (
        <div className="card">
          <h3>Riwayat Perubahan Stok</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Sumber</th>
                  <th className="num-col">Jumlah</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="muted">{new Date(m.createdAt).toLocaleString("id-ID")}</td>
                    <td>
                      <span className={`badge ${m.source === "purchase" ? "badge-success" : m.source === "sale" ? "badge-danger" : "badge-warning"}`}>
                        {sourceLabel(m.source)}
                      </span>
                    </td>
                    <td
                      className="num-col"
                      style={{ color: m.quantity > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}
                    >
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td className="muted">{m.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
