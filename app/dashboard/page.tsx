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

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!data) return null;

  const typeColor = (t: string) =>
    t === "purchase" ? "#16a34a" : t === "sale" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24, marginBottom: 32 }}>
        <div className="card">
          <p style={{ color: "#666", margin: 0 }}>Total Products</p>
          <h2 style={{ margin: "8px 0 0", color: "#3b82f6" }}>{data.totalProducts}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
            {data.activeProducts} active
          </p>
        </div>
        <div className="card">
          <p style={{ color: "#666", margin: 0 }}>Total Stock</p>
          <h2 style={{ margin: "8px 0 0" }}>{data.totalStock.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <p style={{ color: "#666", margin: 0 }}>Low Stock</p>
          <h2 style={{ margin: "8px 0 0", color: "#f59e0b" }}>{data.lowStockCount}</h2>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <p style={{ color: "#666", margin: 0 }}>Out of Stock</p>
          <h2 style={{ margin: "8px 0 0", color: "#ef4444" }}>{data.outOfStockCount}</h2>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <p style={{ color: "#666", margin: 0 }}>Pending Purchases</p>
          <h2 style={{ margin: "8px 0 0", color: "#3b82f6" }}>{data.pendingPurchases}</h2>
        </div>
        <div className="card">
          <p style={{ color: "#666", margin: 0 }}>Total Purchases</p>
          <h2 style={{ margin: "8px 0 0" }}>{data.totalPurchases}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
            Rp {data.totalPurchaseAmount.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p style={{ color: "#666", margin: 0 }}>Total Sales</p>
          <h2 style={{ margin: "8px 0 0" }}>{data.totalSales}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
            Rp {data.totalSalesAmount.toLocaleString()}
          </p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <p style={{ color: "#666", margin: 0 }}>AI Agent</p>
          <h2 style={{ margin: "8px 0 0", color: data.aiAgent?.enabled ? "#16a34a" : "#ef4444" }}>
            {data.aiAgent?.enabled ? "ON" : "OFF"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
            {data.aiAgent?.scheduledEnabled ? "Scheduled" : "Manual only"}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3>Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p>No recent activity.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((a, i) => (
                <tr key={i}>
                  <td style={{ color: typeColor(a.type), fontWeight: 600, textTransform: "capitalize" }}>
                    {a.type}
                  </td>
                  <td>{a.product}</td>
                  <td>{a.sku}</td>
                  <td style={{ color: a.quantity > 0 ? "#16a34a" : "#ef4444" }}>
                    {a.quantity > 0 ? "+" : ""}{a.quantity}
                  </td>
                  <td>{a.note || "-"}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/products" className="btn-secondary" style={{ textDecoration: "none" }}>
          Products
        </Link>
        <Link href="/inventory" className="btn-secondary" style={{ textDecoration: "none" }}>
          Inventory
        </Link>
        <Link href="/purchases" className="btn-secondary" style={{ textDecoration: "none" }}>
          Purchases
        </Link>
        <Link href="/sales" className="btn-secondary" style={{ textDecoration: "none" }}>
          Sales
        </Link>
        <Link href="/ocr" className="btn-secondary" style={{ textDecoration: "none" }}>
          OCR
        </Link>
      </div>
    </div>
  );
}
