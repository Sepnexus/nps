"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/utils";

const COLORS = [
  "hsl(var(--chart-debt))",
  "hsl(var(--chart-expense))",
  "hsl(var(--chart-savings))",
  "hsl(var(--chart-investment))",
  "hsl(var(--chart-income))",
  "hsl(var(--muted-foreground))",
];

export function BreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => formatMoney(v)}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
