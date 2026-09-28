"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";

type PurchaseItem = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: { name: string; sku: string };
};

type Purchase = {
  id: string;
  purchaseNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  supplier: { name: string; contact: string | null; address: string | null };
  items: PurchaseItem[];
};

export default function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPurchase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/purchases/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal load purchase");
      }
      const data = await res.json();
      setPurchase(data.purchase);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  async function handleAction(action: "confirm" | "cancel") {
    const msg = action === "confirm"
      ? "Confirm? Stock akan bertambah."
      : "Cancel purchase ini?";
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/purchases/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal");
        return;
      }
      fetchPurchase();
    } catch {
      alert("Network error");
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!purchase) return <div className="container"><p>Purchase not found.</p></div>;

  const statusColor =
    purchase.status === "confirmed" ? "#16a34a" : purchase.status === "cancelled" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>{purchase.purchaseNo}</h1>
          <p style={{ margin: 0, color: "#666" }}>
            {purchase.supplier.name} — {new Date(purchase.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/purchases" className="btn-secondary" style={{ textDecoration: "none" }}>
            Back
          </Link>
          {purchase.status === "draft" && (
            <>
              <button onClick={() => handleAction("confirm")} className="btn-primary">
                Confirm
              </button>
              <button onClick={() => handleAction("cancel")} className="btn-danger">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <p><strong>Status:</strong>{" "}
          <span style={{ color: statusColor, fontWeight: 600 }}>{purchase.status}</span>
        </p>
        {purchase.note && <p><strong>Note:</strong> {purchase.note}</p>}
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
            {purchase.items.map((item) => (
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
              <td style={{ fontWeight: 600 }}>{purchase.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
