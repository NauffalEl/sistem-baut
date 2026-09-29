"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CategoryStockData {
  category: string;
  quantity: number;
  percentage: number;
}

interface Props {
  data: CategoryStockData[];
}

const COLORS = [
  "#2c5fd6", // steel blue
  "#067647", // green
  "#b25e09", // amber
  "#c62a30", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function StockCompositionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Komposisi Stok per Kategori</h3>
        <p className="empty-state">Tidak ada data stok</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Komposisi Stok per Kategori</h3>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        Persentase distribusi stok
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="quantity"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              fontSize: "0.875rem",
              color: "var(--ink)",
            }}
            formatter={(value: any, name: any, props: any) => [
              `${(value ?? 0).toLocaleString()} unit (${props.payload.percentage}%)`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.875rem" }}
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}