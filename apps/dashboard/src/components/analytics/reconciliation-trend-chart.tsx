"use client";

import {
  Area,
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
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
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

  const labels: Record<string, string> = {
    gross: "Gross Revenue",
    net: "Net Deposited",
    fees: "Processing Fees",
  };

  const grossVal = payload.find((e) => e.dataKey === "gross")?.value ?? 0;
  const netVal = payload.find((e) => e.dataKey === "net")?.value ?? 0;
  const feeGap = grossVal - netVal;

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-3 text-xs shadow-sm">
      <p className="text-[#888] mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm">
          <span className="text-[#666]">
            {labels[entry.dataKey] ?? entry.dataKey}:{" "}
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </p>
      ))}
      {feeGap > 0 && (
        <p className="text-sm mt-1 pt-1 border-t border-[#eee]">
          <span className="text-[#666]">Fee Gap: </span>
          <span className="font-medium text-red-600">
            {formatCurrency(feeGap)}
          </span>
        </p>
      )}
    </div>
  );
}

export function ReconciliationTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
        <p className="text-sm text-[#888]">No trend data available yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#333]">
          Gross vs Net Deposited (Last 6 Months)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#333] rounded-sm" />
            <span className="text-xs text-[#888]">Gross</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#22c55e] rounded-sm" />
            <span className="text-xs text-[#888]">Net</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-400" />
            <span className="text-xs text-[#888]">Fees</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 6, right: 6, left: -10, bottom: 6 }}
        >
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
          <Area
            type="monotone"
            dataKey="gross"
            fill="#f0f0f0"
            stroke="#333"
            strokeWidth={2}
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="net"
            fill="#dcfce7"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={0.4}
          />
          <Line
            type="monotone"
            dataKey="fees"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-[#999] mt-2 text-center">
        The gap between the lines represents total processing fees deducted from
        gross revenue.
      </p>
    </div>
  );
}
