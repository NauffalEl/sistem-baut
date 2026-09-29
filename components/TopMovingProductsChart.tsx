"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProductData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  movement: number;
}

interface Props {
  data: ProductData[];
}

export function TopMovingProductsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Produk Paling Banyak Bergerak</h3>
        <p className="empty-state">Tidak ada data pergerakan</p>
      </div>
    );
  }

  const chartData = data.slice(0, 10).map((item) => ({
    label: `${item.name.substring(0, 15)}${item.name.length > 15 ? "..." : ""}`,
    ...item,
  }));

  return (
    <div className="card">
      <h3>Produk Paling Banyak Bergerak</h3>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        Total pergerakan stok (keluar+masuk) periode ini
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="var(--chart-axis)"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="var(--chart-axis)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              fontSize: "0.875rem",
              color: "var(--ink)",
            }}
            formatter={(value: any, name: any) => {
              if (name === "movement") {
                return [`${(value ?? 0).toLocaleString()} unit`, "Total Pergerakan"];
              }
              if (name === "quantity") {
                return [`${(value ?? 0).toLocaleString()} unit`, "Stok Saat Ini"];
              }
              return value;
            }}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                const item = payload[0].payload;
                return `${item.name} (SKU: ${item.sku})`;
              }
              return "";
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.875rem", paddingTop: "20px" }} />
          <Bar
            dataKey="movement"
            name="Pergerakan"
            fill="#b25e09"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="quantity"
            name="Stok Saat Ini"
            fill="#2c5fd6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}