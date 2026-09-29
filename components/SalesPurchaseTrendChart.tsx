"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  date: string;
  sales: number;
  purchase: number;
}

interface Props {
  data: TrendPoint[];
}

export function SalesPurchaseTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Tren Penjualan & Pembelian</h3>
        <p className="empty-state">Tidak ada data untuk periode ini</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Tren Penjualan & Pembelian</h3>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        Jumlah barang (quantity) per hari
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="var(--chart-axis)"
            tickFormatter={(value) => {
              const d = new Date(value as any);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
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
            labelFormatter={(value) => {
              const d = new Date(value as any);
              return d.toLocaleDateString("id-ID");
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.875rem" }} />
          <Line
            type="monotone"
            dataKey="sales"
            name="Penjualan"
            stroke="#2c5fd6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="purchase"
            name="Pembelian"
            stroke="#067647"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}