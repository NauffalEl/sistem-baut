"use client";

import { useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  minStock: number;
  aliases: string[];
};

type StockItem = {
  productId: string;
  quantity: number;
  product: Product;
};

export function InventoryQuickPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<"user" | "general">("user");
  const [generalStocks, setGeneralStocks] = useState<StockItem[]>([]);
  const [takingQty, setTakingQty] = useState("");
  const [takingId, setTakingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, genRes] = await Promise.all([
        fetch("/api/user-inventory", { cache: "no-store" }),
        fetch("/api/inventory", { cache: "no-store" }),
      ]);
      const [userData, genData] = await Promise.all([userRes.json(), genRes.json()]);
      setStocks(userData.stocks || []);
      setGeneralStocks(genData.stocks || []);
    } catch {
      setError("Gagal memuat data inventori");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function take(productId: string, name: string) {
    const qty = Number(takingQty);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Jumlah harus angka bulat > 0");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user-inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`${name} diambil ${qty} pcs.`);
      setTakingId(null);
      setTakingQty("");
      setMode("user");
      await fetchData();
    } catch (e: any) {
      setError(e.message || "Gagal mengambil barang");
    } finally {
      setBusy(false);
    }
  }

  const term = filter.trim().toLowerCase();
  const list = mode === "user" ? stocks : generalStocks;
  const visible = term
    ? list.filter(
        (s) =>
          s.product.name.toLowerCase().includes(term) ||
          s.product.sku.toLowerCase().includes(term) ||
          (s.product.aliases ?? []).some((a) => a.toLowerCase().includes(term))
      )
    : list;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Inventori {mode === "user" ? "Saya" : "General"}</h2>
        
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button className={mode === "user" ? "btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => { setMode("user"); setFilter(""); }}>Inventori Saya</button>
          <button className={mode === "general" ? "btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => { setMode("general"); setFilter(""); }}>Ambil dari Gudang</button>
        </div>

        <input className="grow" style={{ width: "100%", marginBottom: 14 }} placeholder="Cari nama, SKU, atau alias…" value={filter} onChange={(e) => setFilter(e.target.value)} autoFocus />

        {error && <p className="message error">{error}</p>}
        {message && <p className="message success">{message}</p>}

        <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
          {visible.map((item) => (
            <div key={item.productId} className="stock-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto" }}>
              <div>
                <div className="cell-strong">{item.product.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{item.product.sku} {(item.product.aliases ?? []).length > 0 && `· alias: ${item.product.aliases.join(", ")}`}</div>
              </div>
              <span className="cell-strong">{item.quantity}</span>
              {mode === "general" && (
                takingId === item.productId ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input type="number" style={{ width: 60 }} value={takingQty} onChange={(e) => setTakingQty(e.target.value)} />
                    <button className="btn-primary btn-sm" disabled={busy} onClick={() => take(item.productId, item.product.name)}>Ambil</button>
                  </div>
                ) : (
                  <button className="action-link" onClick={() => setTakingId(item.productId)}>Ambil</button>
                )
              )}
            </div>
          ))}
        </div>

        <button className="btn-secondary" style={{ marginTop: 18 }} onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}