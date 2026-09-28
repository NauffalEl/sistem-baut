"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";

type SaleItem = {
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
  items: SaleItem[];
};

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deposit, setDeposit] = useState<number | null>(null);

  const fetchSale = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sales/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal load sale");
      }
      const data = await res.json();
      setSale(data.sale);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  async function handleAction(action: "confirm" | "cancel" | "deposit") {
    if (action === "confirm") {
      if (!confirm("Confirm? Stock akan berkurang.")) return;
    }
    if (action === "cancel") {
      if (!confirm("Cancel sale ini?")) return;
    }

    try {
      const res = await fetch(`/api/sales/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal");
        return;
      }
      if (action === "deposit") {
        setDeposit(data.deposit ?? data.total);
      }
      fetchSale();
    } catch {
      alert("Network error");
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!sale) return <div className="container"><p>Sale not found.</p></div>;

  const statusColor =
    sale.status === "confirmed" ? "#16a34a" : sale.status === "cancelled" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>{sale.saleNo}</h1>
          <p style={{ margin: 0, color: "#666" }}>
            {new Date(sale.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/sales" className="btn-secondary" style={{ textDecoration: "none" }}>
            Back
          </Link>
          {sale.status === "draft" && (
            <>
              <button onClick={() => handleAction("confirm")} className="btn-primary">
                Confirm
              </button>
              <button onClick={() => handleAction("cancel")} className="btn-danger">
                Cancel
              </button>
            </>
          )}
          {sale.status === "confirmed" && (
            <button onClick={() => handleAction("deposit")} style={{ background: "#3b82f6", color: "#fff", border: "none" }}>
              {deposit !== null ? `Deposit: ${deposit.toLocaleString()}` : "Calculate Deposit"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <p><strong>Status:</strong>{" "}
          <span style={{ color: statusColor, fontWeight: 600 }}>{sale.status}</span>
        </p>
        {sale.note && <p><strong>Note:</strong> {sale.note}</p>}
      </div>

      <div className="card">
        <h3>Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.product.sku}</td>
                <td>{item.quantity}</td>
                <td>{item.price.toLocaleString()}</td>
                <td>{item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>Total</td>
              <td style={{ fontWeight: 600 }}>{sale.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
