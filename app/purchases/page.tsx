"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Purchase = {
  id: string;
  purchaseNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  supplier: { name: string };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    productId: string;
  }>;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/purchases?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load purchases");
      const data = await res.json();
      setPurchases(data.items);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  async function handleConfirm(id: string) {
    if (!confirm("Confirm this purchase? Stock will increase.")) return;
    try {
      const res = await fetch(`/api/purchases/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal confirm");
        return;
      }
      fetchPurchases();
    } catch {
      alert("Network error");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this purchase?")) return;
    try {
      const res = await fetch(`/api/purchases/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal cancel");
        return;
      }
      fetchPurchases();
    } catch {
      alert("Network error");
    }
  }

  const statusColor = (s: string) =>
    s === "confirmed" ? "#16a34a" : s === "cancelled" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Purchases</h1>
        <Link href="/purchases/new" className="btn-primary" style={{ textDecoration: "none" }}>
          + New Purchase
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div style={{ marginBottom: 16 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : purchases.length === 0 ? (
        <p>No purchases found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>PO No</th>
              <th>Supplier</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td>{p.purchaseNo}</td>
                <td>{p.supplier.name}</td>
                <td>{p.items.length}</td>
                <td>{p.total}</td>
                <td style={{ color: statusColor(p.status), fontWeight: 600 }}>{p.status}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/purchases/${p.id}`}>View</Link>
                  {p.status === "draft" && (
                    <>
                      {" | "}
                      <button onClick={() => handleConfirm(p.id)} style={{ color: "#16a34a", background: "none", border: "none", cursor: "pointer" }}>
                        Confirm
                      </button>
                      {" | "}
                      <button onClick={() => handleCancel(p.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
