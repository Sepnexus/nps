"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils";

export function CashflowChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-income))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v) => formatMoney(v, { compact: true })}
        />
        <Tooltip
          formatter={(v: number) => formatMoney(v)}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
          }}
        />
        <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-income))" fill="url(#g-income)" strokeWidth={2} />
        <Area type="monotone" dataKey="expense" stroke="hsl(var(--chart-expense))" fill="url(#g-expense)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
