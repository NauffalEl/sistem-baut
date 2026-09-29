"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type StockItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    minStock: number;
    active: boolean;
  };
};

type Detected = {
  id: string;
  name: string;
  sku: string;
  minStock: number;
  inventory: { quantity: number } | null;
};

type Status = "out" | "low" | "ok";

const STATUS_LABEL: Record<Status, string> = {
  out: "Stok Habis",
  low: "Stok Menipis",
  ok: "Aman",
};

export default function InventoryPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<Detected[]>([]);
  const [outOfStock, setOutOfStock] = useState<Detected[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Inline adjustment state — one row is edited at a time.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustDir, setAdjustDir] = useState<"in" | "out">("in");
  const [adjustNote, setAdjustNote] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stockRes, lowRes, outRes] = await Promise.all([
        fetch("/api/inventory", { cache: "no-store" }),
        fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "low-stock" }),
        }),
        fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "out-of-stock" }),
        }),
      ]);

      if (!stockRes.ok) throw new Error("Gagal memuat data inventori");
      const stockData = await stockRes.json();
      setStocks(stockData.stocks || []);

      if (lowRes.ok) {
        const lowData = await lowRes.json();
        setLowStock(lowData.products || []);
      }
      if (outRes.ok) {
        const outData = await outRes.json();
        setOutOfStock(outData.products || []);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function startEdit(item: StockItem) {
    setEditingId(item.productId);
    setAdjustQty("");
    setAdjustDir("in");
    setAdjustNote("");
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setAdjustQty("");
    setAdjustNote("");
  }

  async function handleAdjust(productId: string) {
    const qty = Number(adjustQty);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Jumlah harus berupa angka bulat lebih dari 0");
      return;
    }

    setSavingId(productId);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/inventory/${productId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: qty,
          direction: adjustDir,
          source: "adjustment",
          note: adjustNote.trim() || "Penyesuaian stok",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan penyesuaian stok");
        return;
      }
      setMessage("Stok berhasil disesuaikan");
      cancelEdit();
      await fetchAll();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSavingId(null);
    }
  }

  function stockStatus(item: StockItem): Status {
    if (item.quantity <= 0) return "out";
    if (item.quantity <= item.product.minStock) return "low";
    return "ok";
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Inventori</h1>
          <p className="page-sub">Pantau stok dan sesuaikan jumlah barang</p>
        </div>
      </div>

      {error && <p className="message error">{error}</p>}
      {message && <p className="message success">{message}</p>}

      {/* Peringatan stok menipis / habis */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="chart-grid" style={{ marginBottom: 20 }}>
          {lowStock.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
              <h3 className="tone-warning">Stok Menipis ({lowStock.length})</h3>
              <ul>
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/inventory/${p.id}`}>
                      {p.name} ({p.sku})
                    </Link>{" "}
                    — sisa {p.inventory?.quantity ?? 0}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {outOfStock.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <h3 className="tone-danger">Stok Habis ({outOfStock.length})</h3>
              <ul>
                {outOfStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/inventory/${p.id}`}>
                      {p.name} ({p.sku})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabel stok */}
      {loading ? (
        <p className="muted">Memuat data…</p>
      ) : stocks.length === 0 ? (
        <div className="card empty-state">
          Belum ada data inventori. Stok akan muncul setelah pembelian dikonfirmasi.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>SKU</th>
                <th className="num-col">Jumlah</th>
                <th className="num-col">Stok Min</th>
                <th>Status</th>
                <th>Riwayat</th>
                <th className="action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((item) => {
                const status = stockStatus(item);
                const isEditing = editingId === item.productId;
                return (
                  <tr key={item.productId} style={isEditing ? { background: "var(--accent-soft)" } : undefined}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{item.product.name}</td>
                    <td className="num">{item.product.sku}</td>
                    <td className="num-col">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          placeholder="Jumlah"
                          aria-label={`Jumlah penyesuaian untuk ${item.product.name}`}
                          autoFocus
                          className="qty-input"
                        />
                      ) : (
                        <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                      )}
                    </td>
                    <td className="num-col">{item.product.minStock}</td>
                    <td>
                      <span className={`badge ${status === "out" ? "badge-danger" : status === "low" ? "badge-warning" : "badge-success"}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td>
                      <Link href={`/inventory/${item.productId}`} className="action-link">
                        Riwayat
                      </Link>
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <select
                            value={adjustDir}
                            onChange={(e) => setAdjustDir(e.target.value as "in" | "out")}
                            aria-label="Arah penyesuaian"
                            style={{ width: 82 }}
                          >
                            <option value="in">+ Tambah</option>
                            <option value="out">− Kurang</option>
                          </select>
                          <input
                            type="text"
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                            placeholder="Alasan"
                            aria-label="Alasan penyesuaian"
                            style={{ width: 120 }}
                          />
                          <button
                            onClick={() => handleAdjust(item.productId)}
                            className="action-link edit"
                            disabled={savingId === item.productId}
                          >
                            {savingId === item.productId ? "Menyimpan…" : "Simpan"}
                          </button>
                          <button onClick={cancelEdit} className="action-link">
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <button onClick={() => startEdit(item)} className="action-link edit">
                            Sesuaikan Qty
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
