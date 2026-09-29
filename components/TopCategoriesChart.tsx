"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  category: string;
  total: number;
}

interface Props {
  data: CategoryData[];
}

export function TopCategoriesChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Kategori Produk</h3>
        <p className="empty-state">Tidak ada data kategori</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Top Kategori Produk</h3>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        Total stok per kategori (top 5)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12 }}
            stroke="var(--chart-axis)"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--chart-axis)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              fontSize: "0.875rem",
              color: "var(--ink)",
            }}
            formatter={(value: any) => [`${(value ?? 0).toLocaleString()} unit`, "Total Stok"]}
          />
          <Bar
            dataKey="total"
            fill="#2c5fd6"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}