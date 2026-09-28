"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Sale = {
  id: string;
  saleNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    productId: string;
  }>;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/sales?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load sales");
      const data = await res.json();
      setSales(data.items);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  async function handleConfirm(id: string) {
    if (!confirm("Confirm this sale? Stock will decrease.")) return;
    try {
      const res = await fetch(`/api/sales/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal confirm");
        return;
      }
      fetchSales();
    } catch {
      alert("Network error");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this sale?")) return;
    try {
      const res = await fetch(`/api/sales/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal cancel");
        return;
      }
      fetchSales();
    } catch {
      alert("Network error");
    }
  }

  async function handleDeposit(id: string) {
    try {
      const res = await fetch(`/api/sales/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal hitung deposit");
        return;
      }
      alert(`Deposit: ${data.deposit?.toLocaleString() ?? data.total?.toLocaleString()}`);
    } catch {
      alert("Network error");
    }
  }

  const statusColor = (s: string) =>
    s === "confirmed" ? "#16a34a" : s === "cancelled" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Sales</h1>
        <Link href="/sales/new" className="btn-primary" style={{ textDecoration: "none" }}>
          + New Sale
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
      ) : sales.length === 0 ? (
        <p>No sales found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SO No</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.saleNo}</td>
                <td>{s.items.length}</td>
                <td>{s.total}</td>
                <td style={{ color: statusColor(s.status), fontWeight: 600 }}>{s.status}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/sales/${s.id}`}>View</Link>
                  {s.status === "draft" && (
                    <>
                      {" | "}
                      <button onClick={() => handleConfirm(s.id)} style={{ color: "#16a34a", background: "none", border: "none", cursor: "pointer" }}>
                        Confirm
                      </button>
                      {" | "}
                      <button onClick={() => handleCancel(s.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </>
                  )}
                  {s.status === "confirmed" && (
                    <>
                      {" | "}
                      <button onClick={() => handleDeposit(s.id)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>
                        Deposit
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
