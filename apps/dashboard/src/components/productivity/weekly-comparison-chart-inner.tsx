"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyComparison } from "./productivity-dashboard";

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="border border-[#e6e6e6] bg-white p-2 text-[10px] shadow-sm">
      <p className="mb-1 text-[#707070] font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[#333]">
          {entry.dataKey === "plannedHrs" ? "Planned" : "Actual"}:{" "}
          {entry.value.toFixed(1)}h
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function ChartLegendContent() {
  const items = [
    { label: "Planned", color: "#C6C6C6" },
    { label: "Actual", color: "#333333" },
  ];

  return (
    <div className="flex justify-end gap-4 mt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-[#888]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

interface Props {
  data: DailyComparison[];
  operatorName: string;
}

export default function WeeklyComparisonChartInner({
  data,
  operatorName,
}: Props) {
  return (
    <div>
      <p className="text-sm text-[#878787] mb-4">
        {operatorName} -- planned vs actual hours by day
      </p>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={4}
            margin={{ top: 6, right: 6, left: -20, bottom: 6 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid-stroke, #e5e5e5)"
            />
            <XAxis
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#888", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#888", fontSize: 10 }}
              tickFormatter={(value: number) => `${value}h`}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Legend content={<ChartLegendContent />} />
            <Bar
              dataKey="plannedHrs"
              fill="#C6C6C6"
              radius={[2, 2, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="actualHrs"
              fill="#333333"
              radius={[2, 2, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
