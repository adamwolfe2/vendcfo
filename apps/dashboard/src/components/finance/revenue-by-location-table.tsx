"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

interface LocationRevenue {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  transactionCount: number;
  prevGrossRevenue: number;
  prevNetDeposited: number;
}

type SortKey = "locationName" | "grossRevenue" | "processingFees" | "netDeposited" | "transactionCount";

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

function ChangeCell({ current, previous }: { current: number; previous: number }) {
  const change = calcChange(current, previous);
  if (Math.abs(change) < 0.5) {
    return <span className="text-xs text-[#888]">--</span>;
  }
  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}
    >
      {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-medium text-[#666] hover:text-black transition-colors"
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp size={12} strokeWidth={1.5} />
        ) : (
          <ArrowDown size={12} strokeWidth={1.5} />
        )
      ) : (
        <ArrowUpDown size={12} strokeWidth={1.5} className="text-[#ccc]" />
      )}
    </button>
  );
}

export function RevenueByLocationTable({
  data,
}: {
  data: LocationRevenue[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("grossRevenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortKey, sortDirection]);

  if (data.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
        <p className="text-sm text-[#888]">
          No revenue data yet. Revenue records will appear here once locations
          report transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
              <th className="text-left px-4 py-3">
                <SortButton
                  label="Location"
                  sortKey="locationName"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Gross Revenue"
                  sortKey="grossRevenue"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Fees"
                  sortKey="processingFees"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Net"
                  sortKey="netDeposited"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Txns"
                  sortKey="transactionCount"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-xs font-medium text-[#666]">MoM</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.locationId}
                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-sm">
                  {row.locationName}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(row.grossRevenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#888]">
                  {formatCurrency(row.processingFees)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(row.netDeposited)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#888]">
                  {row.transactionCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChangeCell
                    current={row.grossRevenue}
                    previous={row.prevGrossRevenue}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#e0e0e0] bg-[#fafafa] font-medium">
              <td className="px-4 py-3 text-sm">Total</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(data.reduce((s, r) => s + r.grossRevenue, 0))}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#888]">
                {formatCurrency(data.reduce((s, r) => s + r.processingFees, 0))}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(data.reduce((s, r) => s + r.netDeposited, 0))}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#888]">
                {data.reduce((s, r) => s + r.transactionCount, 0).toLocaleString()}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
