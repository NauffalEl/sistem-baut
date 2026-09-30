"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PresenceRail } from "@/components/presence/PresenceRail";

type StockItem = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    minStock: number;
  };
};

type Transfer = {
  id: string;
  productId: string;
  quantity: number;
  sequenceNumber: number;
  note: string | null;
  createdAt: string;
};

export default function UserInventoryPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/inventory?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal memuat inventori user");
        const data = await res.json();
        if (!active) return;
        setStocks(data.stocks || []);
        setTransfers(data.transfers || []);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "Gagal memuat inventori user");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Inventori User</h1>
          <p className="page-sub">Barang yang diambil dari inventori general</p>
        </div>
        <div className="page-head-actions">
          <Link href="/inventory" className="btn-secondary">
            ← Kembali
          </Link>
        </div>
      </div>

      <PresenceRail />

      {error && <p className="message error">{error}</p>}

      {loading ? (
        <p className="muted">Memuat data…</p>
      ) : stocks.length === 0 ? (
        <div className="card empty-state">
          User ini belum mengambil barang dari inventori general.
        </div>
      ) : (
        <>
          <p className="table-meta">
            {stocks.length} item · total {stocks.reduce((n, s) => n + s.quantity, 0)} pcs
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th className="num-col">Jumlah</th>
                  <th className="num-col">Pengambilan</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((item) => {
                  const taken = transfers.filter((t) => t.productId === item.productId);
                  return (
                    <tr key={item.productId}>
                      <td className="cell-strong">{item.product.name}</td>
                      <td className="stock-row-sku">{item.product.sku}</td>
                      <td className="num-col">
                        <span
                          className={`stock-row-qty ${
                            item.quantity <= 0 ? "tone-danger" : item.quantity <= item.product.minStock ? "tone-warning" : ""
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="num-col">
                        {taken.length > 0 ? (
                          <span className="badge-muted">ke-{taken.length}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 650, marginBottom: 10 }}>
              Riwayat pengambilan (urutan hari ini)
            </h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Urutan</th>
                    <th>Produk</th>
                    <th className="num-col">Jumlah</th>
                    <th>Catatan</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        Belum ada pengambilan.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => {
                      const product = stocks.find((s) => s.productId === t.productId);
                      return (
                        <tr key={t.id}>
                          <td>
                            <span className="badge-muted">ke-{t.sequenceNumber}</span>
                          </td>
                          <td className="cell-strong">{product?.product.name ?? t.productId}</td>
                          <td className="num-col">{t.quantity}</td>
                          <td className="muted">{t.note ?? "—"}</td>
                          <td className="muted">{new Date(t.createdAt).toLocaleString("id-ID")}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
