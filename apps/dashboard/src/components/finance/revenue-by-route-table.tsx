"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

interface RouteRevenue {
  routeName: string;
  totalGross: number;
  totalNet: number;
  locationCount: number;
  avgRevenuePerLocation: number;
}

type SortKey = "routeName" | "totalGross" | "totalNet" | "locationCount" | "avgRevenuePerLocation";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

export function RevenueByRouteTable({ data }: { data: RouteRevenue[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalGross");
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
          No route revenue data yet. Assign locations to routes and add revenue
          records to see route-level summaries.
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
                  label="Route"
                  sortKey="routeName"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Total Gross"
                  sortKey="totalGross"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Total Net"
                  sortKey="totalNet"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Locations"
                  sortKey="locationCount"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton
                  label="Avg / Location"
                  sortKey="avgRevenuePerLocation"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.routeName}
                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-sm">
                  {row.routeName}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(row.totalGross)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(row.totalNet)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#888]">
                  {row.locationCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(row.avgRevenuePerLocation)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
