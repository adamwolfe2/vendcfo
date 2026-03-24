"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyTrend {
  month: string;
  gross: number;
  net: number;
  fees: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTick(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-[#e0e0e0] p-3 text-xs shadow-sm">
      <p className="text-[#888] mb-2">{label}</p>
      {payload.map((entry) => {
        const labels: Record<string, string> = {
          gross: "Gross Revenue",
          net: "Net Deposited",
          fees: "Fees",
        };
        return (
          <p key={entry.dataKey} className="text-sm">
            <span className="text-[#666]">{labels[entry.dataKey] ?? entry.dataKey}: </span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </p>
        );
      })}
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
        <p className="text-sm text-[#888]">
          No trend data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Revenue Trend</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black rounded-sm" />
            <span className="text-xs text-[#888]">Gross</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#666] rounded-sm" />
            <span className="text-xs text-[#888]">Net</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-400" />
            <span className="text-xs text-[#888]">Fees</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 10 }}
            tickFormatter={formatTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="gross"
            fill="#000"
            radius={[2, 2, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="net"
            fill="#666"
            radius={[2, 2, 0, 0]}
            barSize={24}
          />
          <Line
            type="monotone"
            dataKey="fees"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
