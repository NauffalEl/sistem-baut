"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SalesPurchaseTrendChart } from "@/components/SalesPurchaseTrendChart";
import { StockCompositionChart } from "@/components/StockCompositionChart";
import { TopCategoriesChart } from "@/components/TopCategoriesChart";
import { TopMovingProductsChart } from "@/components/TopMovingProductsChart";

type ChartMetrics = {
  trends: Array<{ date: string; sales: number; purchase: number }>;
  categoryComposition: Array<{ category: string; quantity: number; percentage: number }>;
  topCategories: Array<{ category: string; total: number }>;
  topMovingProducts: Array<{
    name: string;
    sku: string;
    category: string;
    quantity: number;
    movement: number;
  }>;
};

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
  latestReport: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    createdAt: string;
  } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<ChartMetrics | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message || "Gagal load dashboard");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - daysFilter);

    const query = new URLSearchParams({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });

    fetch(`/api/dashboard/metrics?${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setCharts(d);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [daysFilter]);

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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: 3 }}>
            <button
              onClick={() => setDaysFilter(7)}
              style={{
                background: daysFilter === 7 ? "var(--accent)" : "transparent",
                color: daysFilter === 7 ? "#fff" : "var(--ink)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDaysFilter(30)}
              style={{
                background: daysFilter === 30 ? "var(--accent)" : "transparent",
                color: daysFilter === 30 ? "#fff" : "var(--ink)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              30 Hari
            </button>
            <button
              onClick={() => setDaysFilter(365)}
              style={{
                background: daysFilter === 365 ? "var(--accent)" : "transparent",
                color: daysFilter === 365 ? "#fff" : "var(--ink)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              1 Tahun
            </button>
          </div>
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

      {/* Laporan AI Terakhir */}
      {data.latestReport && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Laporan AI: {data.latestReport.title}</h3>
            <span className="badge badge-info" style={{ textTransform: "capitalize" }}>{data.latestReport.type}</span>
          </div>
          <p style={{ whiteSpace: "pre-line", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>{data.latestReport.content}</p>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12 }}>Dibuat: {new Date(data.latestReport.createdAt).toLocaleString("id-ID")}</span>
          </div>
        </div>
      )}

      {/* Charts (2 columns layout) */}
      {charts && (
        <div className="chart-grid">
          <SalesPurchaseTrendChart data={charts.trends} />
          <StockCompositionChart data={charts.categoryComposition} />
          <TopCategoriesChart data={charts.topCategories} />
          <TopMovingProductsChart data={charts.topMovingProducts} />
        </div>
      )}

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
                    <td><span className={`badge ${typeBadge(a.type)}`} style={{ textTransform: "capitalize" }}>{a.type}</span></td>
                    <td>{a.product}</td>
                    <td className="num">{a.sku}</td>
                    <td className="num" style={{ color: a.quantity > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{a.quantity > 0 ? "+" : ""}{a.quantity}</td>
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