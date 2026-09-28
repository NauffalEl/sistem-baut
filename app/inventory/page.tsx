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

export default function InventoryPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<Detected[]>([]);
  const [outOfStock, setOutOfStock] = useState<Detected[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustProduct, setAdjustProduct] = useState<string | null>(null);
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

      if (!stockRes.ok) throw new Error("Gagal load inventory");
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
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleAdjust(productId: string) {
    const res = await fetch(`/api/inventory/${productId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: Number(adjustQty) || 0,
        direction: adjustDir,
        source: "adjustment",
        note: adjustNote,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal adjustment");
      return;
    }
    setAdjustProduct(null);
    setAdjustQty("");
    setAdjustNote("");
    fetchAll();
  }

  function stockStatus(item: StockItem): "out" | "low" | "ok" {
    if (item.quantity <= 0) return "out";
    if (item.quantity <= item.product.minStock) return "low";
    return "ok";
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Inventory</h1>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Low / Out of stock alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <h3 style={{ color: "#f59e0b" }}>Low Stock ({lowStock.length})</h3>
            <ul>
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.sku}) — {p.inventory?.quantity ?? 0} tersisa
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
            <h3 style={{ color: "#ef4444" }}>Out of Stock ({outOfStock.length})</h3>
            <ul>
              {outOfStock.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.sku})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stock table */}
      {loading ? (
        <p>Loading...</p>
      ) : stocks.length === 0 ? (
        <p>No inventory records yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Min</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((item) => {
              const status = stockStatus(item);
              const color =
                status === "out" ? "#ef4444" : status === "low" ? "#f59e0b" : "#16a34a";
              return (
                <tr key={item.productId}>
                  <td>
                    <Link href={`/products/${item.productId}`}>{item.product.name}</Link>
                  </td>
                  <td>{item.product.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{item.product.minStock}</td>
                  <td>
                    <span style={{ color, fontWeight: 600 }}>
                      {status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "OK"}
                    </span>
                  </td>
                  <td>
                    {adjustProduct === item.productId ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          type="number"
                          min="1"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          style={{ width: 60 }}
                        />
                        <select
                          value={adjustDir}
                          onChange={(e) => setAdjustDir(e.target.value as "in" | "out")}
                        >
                          <option value="in">+</option>
                          <option value="out">−</option>
                        </select>
                        <input
                          placeholder="Note"
                          value={adjustNote}
                          onChange={(e) => setAdjustNote(e.target.value)}
                          style={{ width: 80 }}
                        />
                        <button onClick={() => handleAdjust(item.productId)} className="btn-primary">
                          Save
                        </button>
                        <button onClick={() => setAdjustProduct(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAdjustProduct(item.productId)}>Adjust</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
