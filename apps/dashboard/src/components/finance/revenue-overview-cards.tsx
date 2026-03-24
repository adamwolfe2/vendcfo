"use client";

import { ArrowDown, ArrowUp, DollarSign, Minus, Receipt } from "lucide-react";

interface RevenueOverviewData {
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  prevGrossRevenue: number;
  prevProcessingFees: number;
  prevNetDeposited: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function ChangeIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#888]">
        <Minus size={12} strokeWidth={1.5} />
        0%
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}
    >
      {isPositive ? (
        <ArrowUp size={12} strokeWidth={1.5} />
      ) : (
        <ArrowDown size={12} strokeWidth={1.5} />
      )}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

interface CardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: CardProps) {
  return (
    <div className="border border-[#e0e0e0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#878787] font-medium">{title}</span>
        <span className="text-[#999]">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <div className="mt-1">
        <ChangeIndicator change={change} />
        <span className="text-xs text-[#999] ml-1">vs last month</span>
      </div>
    </div>
  );
}

export function RevenueOverviewCards({ data }: { data: RevenueOverviewData }) {
  const grossChange = calcChange(data.grossRevenue, data.prevGrossRevenue);
  const feesChange = calcChange(data.processingFees, data.prevProcessingFees);
  const netChange = calcChange(data.netDeposited, data.prevNetDeposited);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Gross Revenue"
        value={formatCurrency(data.grossRevenue)}
        change={grossChange}
        icon={<DollarSign size={16} strokeWidth={1.5} />}
      />
      <StatCard
        title="Processing Fees"
        value={formatCurrency(data.processingFees)}
        change={feesChange}
        icon={<Receipt size={16} strokeWidth={1.5} />}
      />
      <StatCard
        title="Net Deposited"
        value={formatCurrency(data.netDeposited)}
        change={netChange}
        icon={<DollarSign size={16} strokeWidth={1.5} />}
      />
    </div>
  );
}
