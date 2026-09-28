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
      if (stockRes.ok) {
        const d = await stockRes.json();
        setStock(d.stock);
      }
      if (histRes.ok) {
        const d = await histRes.json();
        setMovements(d.items || []);
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Stock History</h1>
          {stock && <p style={{ margin: 0, color: "#666" }}>{stock.product.name} ({stock.product.sku}) — Current: {stock.quantity}</p>}
        </div>
        <Link href="/inventory" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Inventory
        </Link>
      </div>

      {movements.length === 0 ? (
        <p>No movements yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Qty</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.source}</td>
                <td style={{ color: m.quantity > 0 ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </td>
                <td>{m.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
