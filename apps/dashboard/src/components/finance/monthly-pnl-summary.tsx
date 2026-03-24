"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PnlData {
  grossRevenue: number;
  processingFees: number;
  laborCosts: number;
  operatingExpenses: number;
  rent: number;
  insurance: number;
  otherExpenses: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PnlRow({
  label,
  amount,
  isSubItem = false,
  isBold = false,
  isNegative = false,
  children,
}: {
  label: string;
  amount: number;
  isSubItem?: boolean;
  isBold?: boolean;
  isNegative?: boolean;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(children);

  return (
    <>
      <div
        className={`flex items-center justify-between py-2.5 px-4 ${
          isBold ? "font-medium" : ""
        } ${isSubItem ? "pl-10 text-[#666]" : ""} ${
          hasChildren ? "cursor-pointer hover:bg-[#fafafa] transition-colors" : ""
        }`}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
        onKeyDown={
          hasChildren
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") setExpanded(!expanded);
              }
            : undefined
        }
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
      >
        <div className="flex items-center gap-2">
          {hasChildren &&
            (expanded ? (
              <ChevronDown size={14} strokeWidth={1.5} className="text-[#999]" />
            ) : (
              <ChevronRight size={14} strokeWidth={1.5} className="text-[#999]" />
            ))}
          <span className="text-sm">{label}</span>
        </div>
        <span
          className={`text-sm tabular-nums ${
            isNegative ? "text-red-600" : ""
          } ${isBold ? "font-medium" : ""}`}
        >
          {isNegative && amount > 0 ? `(${formatCurrency(amount)})` : formatCurrency(amount)}
        </span>
      </div>
      {expanded && children}
    </>
  );
}

function Divider() {
  return <div className="border-t border-[#e0e0e0] mx-4" />;
}

export function MonthlyPnlSummary({ data }: { data: PnlData }) {
  const netRevenue = data.grossRevenue - data.processingFees;
  const totalExpenses = data.laborCosts + data.operatingExpenses;
  const netProfit = netRevenue - totalExpenses;
  const profitMargin =
    data.grossRevenue > 0 ? (netProfit / data.grossRevenue) * 100 : 0;

  return (
    <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="bg-[#fafafa] px-4 py-3 border-b border-[#e0e0e0]">
        <h3 className="text-sm font-medium">Monthly P&L Summary</h3>
      </div>

      <div className="divide-y divide-[#f0f0f0]">
        {/* Income Section */}
        <PnlRow label="Gross Revenue" amount={data.grossRevenue} isBold />
        <PnlRow
          label="Processing Fees"
          amount={data.processingFees}
          isNegative
          isSubItem
        />
        <Divider />
        <PnlRow label="Net Revenue" amount={netRevenue} isBold />

        {/* Expenses Section */}
        <div className="bg-[#fafafa] px-4 py-2 border-t border-[#e0e0e0]">
          <span className="text-xs font-medium text-[#888] uppercase tracking-wide">
            Expenses
          </span>
        </div>
        <PnlRow
          label="Labor Costs"
          amount={data.laborCosts}
          isNegative
        />
        <PnlRow
          label="Operating Expenses"
          amount={data.operatingExpenses}
          isNegative
        >
          <PnlRow
            label="Rent"
            amount={data.rent}
            isSubItem
            isNegative
          />
          <PnlRow
            label="Insurance"
            amount={data.insurance}
            isSubItem
            isNegative
          />
          <PnlRow
            label="Other"
            amount={data.otherExpenses}
            isSubItem
            isNegative
          />
        </PnlRow>

        <Divider />
        <PnlRow label="Total Expenses" amount={totalExpenses} isNegative isBold />

        {/* Net Profit */}
        <div className="border-t-2 border-[#333]" />
        <div className="flex items-center justify-between py-3 px-4 bg-[#fafafa]">
          <span className="text-sm font-bold">Net Profit</span>
          <div className="text-right">
            <span
              className={`text-lg font-bold tabular-nums ${
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netProfit < 0
                ? `(${formatCurrency(Math.abs(netProfit))})`
                : formatCurrency(netProfit)}
            </span>
            <span className="block text-xs text-[#888]">
              {profitMargin.toFixed(1)}% margin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
