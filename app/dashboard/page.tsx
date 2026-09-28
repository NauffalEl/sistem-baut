"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type DashboardData = {
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingPurchases: number;
  totalPurchases: number;
  totalPurchaseAmount: number;
  totalSales: number;
  totalSalesAmount: number;
  recentActivity: Array<{
    type: string;
    product: string;
    sku: string;
    quantity: number;
    note: string;
    createdAt: string;
  }>;
  aiAgent: {
    enabled: boolean;
    scheduledEnabled: boolean;
    lastRun: string | null;
    nextRun: string | null;
  } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Gagal load dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container"><p className="muted">Memuat data…</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!data) return null;

  const typeBadge = (t: string) =>
    t === "purchase" ? "badge-success" : t === "sale" ? "badge-danger" : "badge-warning";

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Ringkasan stok, transaksi, dan status AI agent</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/purchases/new" className="btn-primary">+ Pembelian</Link>
          <Link href="/sales/new" className="btn-secondary">+ Penjualan</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat tone-accent">
          <p className="stat-label">Total Produk</p>
          <p className="stat-value tone-accent">{data.totalProducts}</p>
          <p className="stat-sub">{data.activeProducts} aktif</p>
        </div>
        <div className="stat">
          <p className="stat-label">Total Stok</p>
          <p className="stat-value">{data.totalStock.toLocaleString()}</p>
        </div>
        <div className="stat tone-warning">
          <p className="stat-label">Stok Menipis</p>
          <p className="stat-value tone-warning">{data.lowStockCount}</p>
        </div>
        <div className="stat tone-danger">
          <p className="stat-label">Stok Habis</p>
          <p className="stat-value tone-danger">{data.outOfStockCount}</p>
        </div>
        <div className="stat tone-accent">
          <p className="stat-label">Pembelian Pending</p>
          <p className="stat-value tone-accent">{data.pendingPurchases}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Total Pembelian</p>
          <p className="stat-value">{data.totalPurchases}</p>
          <p className="stat-sub">Rp {data.totalPurchaseAmount.toLocaleString("id-ID")}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Total Penjualan</p>
          <p className="stat-value">{data.totalSales}</p>
          <p className="stat-sub">Rp {data.totalSalesAmount.toLocaleString("id-ID")}</p>
        </div>
        <div className={`stat tone-${data.aiAgent?.enabled ? "success" : "danger"}`}>
          <p className="stat-label">AI Agent</p>
          <p className={`stat-value tone-${data.aiAgent?.enabled ? "success" : "danger"}`}>
            {data.aiAgent?.enabled ? "ON" : "OFF"}
          </p>
          <p className="stat-sub">{data.aiAgent?.scheduledEnabled ? "Terjadwal" : "Manual"}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3>Aktivitas Terbaru</h3>
        {data.recentActivity.length === 0 ? (
          <p className="empty-state">Belum ada aktivitas</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Catatan</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${typeBadge(a.type)}`} style={{ textTransform: "capitalize" }}>
                        {a.type}
                      </span>
                    </td>
                    <td>{a.product}</td>
                    <td className="num">{a.sku}</td>
                    <td className="num" style={{ color: a.quantity > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                      {a.quantity > 0 ? "+" : ""}{a.quantity}
                    </td>
                    <td className="muted">{a.note || "—"}</td>
                    <td className="muted">{new Date(a.createdAt).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
