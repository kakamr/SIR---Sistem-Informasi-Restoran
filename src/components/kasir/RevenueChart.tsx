"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RevenueChartProps {
  data: { bulan: string; total: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000015" />
        <XAxis
          dataKey="bulan"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: "#00000090" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: "#00000090" }}
          tickFormatter={(value) => `${value / 1000000}Jt`}
        />
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(Number(value))
          }
        />
        <Bar dataKey="total" fill="#2d5a4a" radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}