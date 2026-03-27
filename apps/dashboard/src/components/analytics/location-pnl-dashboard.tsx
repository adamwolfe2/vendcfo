"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueRecord {
  id: string;
  location_id: string | null;
  period_start: string;
  period_end: string;
  gross_revenue: string;
  processing_fees: string;
  net_deposited: string;
  cash_revenue: string;
  card_revenue: string;
  transaction_count: number;
}

interface LocationRow {
  id: string;
  name: string;
  route_id: string | null;
  rev_share_pct: number | null;
  monthly_rent: number | null;
  stock_hours: number | null;
  pick_hours: number | null;
  service_frequency_days: number | null;
}

interface ServiceScheduleRow {
  location_id: string;
  day_of_week: number;
}

interface OperatorRateRow {
  hourly_rate: string | null;
}

interface TransactionRow {
  amount: number;
  category_slug: string | null;
  location_id: string | null;
}

interface LocationPnl {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  revShare: number;
  revSharePct: number;
  inventoryCost: number;
  laborCost: number;
  netProfit: number;
  marginPct: number;
}

type SortColumn = keyof Pick<
  LocationPnl,
  | "locationName"
  | "grossRevenue"
  | "revShare"
  | "inventoryCost"
  | "laborCost"
  | "netProfit"
  | "marginPct"
>;

type SortDirection = "asc" | "desc";

type PeriodPreset =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "custom";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | number | null | undefined): number {
  return Number(val) || 0;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDetailed(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getQuarterRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const targetQuarter = currentQuarter + offset;
  const targetYear = now.getFullYear() + Math.floor(targetQuarter / 4);
  const q = ((targetQuarter % 4) + 4) % 4;
  const startMonth = q * 3;

  const startDate = new Date(targetYear, startMonth, 1);
  const endDate = new Date(targetYear, startMonth + 3, 0);

  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function getPeriodRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string,
): { start: string; end: string } {
  switch (preset) {
    case "this_month":
      return getMonthRange(0);
    case "last_month":
      return getMonthRange(-1);
    case "this_quarter":
      return getQuarterRange(0);
    case "last_quarter":
      return getQuarterRange(-1);
    case "custom":
      return {
        start: customStart ?? getMonthRange(0).start,
        end: customEnd ?? getMonthRange(0).end,
      };
    default:
      return getMonthRange(0);
  }
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  last_quarter: "Last Quarter",
  custom: "Custom Range",
};

// ---------------------------------------------------------------------------
// Sort Header
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  align = "right",
}: {
  label: string;
  column: SortColumn;
  currentSort: SortColumn;
  currentDirection: SortDirection;
  onSort: (col: SortColumn) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 text-xs font-medium text-[#666] hover:text-[#333] transition-colors ${
        align === "right" ? "ml-auto" : ""
      }`}
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )
      ) : (
        <ArrowUpDown size={12} className="text-[#bbb]" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LocationPnlDashboard({ teamId }: { teamId: string }) {
  const supabase: any = createClient();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LocationPnl[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("netProfit");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [period, setPeriod] = useState<PeriodPreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const handleSort = useCallback(
    (col: SortColumn) => {
      if (sortColumn === col) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(col);
        setSortDirection("desc");
      }
    },
    [sortColumn],
  );

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [rows, sortColumn, sortDirection]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        grossRevenue: acc.grossRevenue + row.grossRevenue,
        revShare: acc.revShare + row.revShare,
        inventoryCost: acc.inventoryCost + row.inventoryCost,
        laborCost: acc.laborCost + row.laborCost,
        netProfit: acc.netProfit + row.netProfit,
      }),
      {
        grossRevenue: 0,
        revShare: 0,
        inventoryCost: 0,
        laborCost: 0,
        netProfit: 0,
      },
    );
  }, [rows]);

  const totalMargin =
    totals.grossRevenue > 0
      ? (totals.netProfit / totals.grossRevenue) * 100
      : 0;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const range = getPeriodRange(period, customStart, customEnd);
      const sb = supabase as any;

      const [
        revenueRes,
        locationsRes,
        schedulesRes,
        ratesRes,
        transactionsRes,
      ] = await Promise.all([
        sb
          .from("revenue_records")
          .select("*")
          .eq("business_id", teamId)
          .gte("period_start", range.start)
          .lte("period_end", range.end),
        sb
          .from("locations")
          .select(
            "id, name, route_id, rev_share_pct, monthly_rent, stock_hours, pick_hours, service_frequency_days",
          )
          .eq("business_id", teamId)
          .eq("is_active", true),
        sb
          .from("service_schedule")
          .select("location_id, day_of_week")
          .eq("business_id", teamId),
        sb
          .from("operator_rates")
          .select("hourly_rate")
          .eq("business_id", teamId),
        sb
          .from("transactions")
          .select("amount, category_slug, location_id")
          .eq("team_id", teamId)
          .gte("date", range.start)
          .lte("date", range.end)
          .in("category_slug", [
            "meals",
            "inventory",
            "cost_of_goods",
            "wholesale",
          ]),
      ]);

      const revenueRecords = (revenueRes.data ?? []) as RevenueRecord[];
      const locations = (locationsRes.data ?? []) as LocationRow[];
      const schedules = (schedulesRes.data ?? []) as ServiceScheduleRow[];
      const rates = (ratesRes.data ?? []) as OperatorRateRow[];
      const inventoryTxns = (transactionsRes.data ?? []) as TransactionRow[];

      const locationsMap = new Map(locations.map((l) => [l.id, l]));

      // Avg hourly rate from operator_rates or fallback
      const avgRate =
        rates.length > 0
          ? rates.reduce((s, r) => s + toNum(r.hourly_rate), 0) / rates.length
          : 25;

      // Revenue per location
      const locationRevMap = new Map<string, number>();
      let totalRevenue = 0;
      for (const rec of revenueRecords) {
        if (!rec.location_id) continue;
        const gross = toNum(rec.gross_revenue);
        locationRevMap.set(
          rec.location_id,
          (locationRevMap.get(rec.location_id) ?? 0) + gross,
        );
        totalRevenue += gross;
      }

      // Inventory cost: sum of negative transaction amounts (costs), allocated proportionally
      const totalInventoryCost = inventoryTxns.reduce(
        (s, t) => s + Math.abs(toNum(t.amount)),
        0,
      );

      // Build per-location inventory cost map (transactions with location_id)
      const directInventoryMap = new Map<string, number>();
      let allocatedInventory = 0;
      for (const txn of inventoryTxns) {
        if (txn.location_id) {
          directInventoryMap.set(
            txn.location_id,
            (directInventoryMap.get(txn.location_id) ?? 0) +
              Math.abs(toNum(txn.amount)),
          );
          allocatedInventory += Math.abs(toNum(txn.amount));
        }
      }
      const unallocatedInventory = totalInventoryCost - allocatedInventory;

      // Service stops per location (from service_schedule)
      const stopsPerLocation = new Map<string, number>();
      for (const sched of schedules) {
        stopsPerLocation.set(
          sched.location_id,
          (stopsPerLocation.get(sched.location_id) ?? 0) + 1,
        );
      }
      const totalWeeklyStops = Array.from(stopsPerLocation.values()).reduce(
        (s, v) => s + v,
        0,
      );

      // Compute per-location P&L
      const pnlRows: LocationPnl[] = [];

      for (const loc of locations) {
        const gross = locationRevMap.get(loc.id) ?? 0;
        if (gross === 0 && !locationRevMap.has(loc.id)) continue;

        const revSharePct = toNum(loc.rev_share_pct);
        const revShare = gross * (revSharePct / 100);

        // Inventory: direct allocation + proportional share of unallocated
        const directInventory = directInventoryMap.get(loc.id) ?? 0;
        const proportionalShare =
          totalRevenue > 0 ? (gross / totalRevenue) * unallocatedInventory : 0;
        const inventoryCost = directInventory + proportionalShare;

        // Labor: location stock_hours + pick_hours per service stop, times weekly stops
        const stockHrs = toNum(loc.stock_hours);
        const pickHrs = toNum(loc.pick_hours);
        const weeklyStops = stopsPerLocation.get(loc.id) ?? 0;
        const weeksInPeriod = getWeeksInPeriod(period, customStart, customEnd);
        const laborHours = (stockHrs + pickHrs) * weeklyStops * weeksInPeriod;

        // If no per-location hours, allocate proportionally by stops
        let laborCost: number;
        if (laborHours > 0) {
          laborCost = laborHours * avgRate;
        } else if (totalWeeklyStops > 0 && weeklyStops > 0) {
          // Proportional allocation based on service stops
          laborCost =
            (weeklyStops / totalWeeklyStops) *
            weeksInPeriod *
            totalWeeklyStops *
            avgRate *
            0.5;
        } else {
          laborCost = 0;
        }

        const netProfit = gross - revShare - inventoryCost - laborCost;
        const marginPct = gross > 0 ? (netProfit / gross) * 100 : 0;

        pnlRows.push({
          locationId: loc.id,
          locationName: loc.name,
          grossRevenue: gross,
          revShare,
          revSharePct,
          inventoryCost,
          laborCost,
          netProfit,
          marginPct,
        });
      }

      setRows(pnlRows);
      setLoading(false);
    }

    fetchData();
  }, [supabase, teamId, period, customStart, customEnd]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#999]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Location P&L</h1>
          <p className="text-sm text-[#878787] mt-1">
            Per-location profitability with revenue, costs, and margins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-sm font-medium text-[#333] hover:border-[#ccc] transition-colors"
            >
              {PERIOD_LABELS[period]}
              <ChevronDown size={14} className="text-[#888]" />
            </button>
            {showPeriodMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-[#e6e6e6] bg-white shadow-lg py-1 min-w-[160px]">
                {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPeriod(key);
                      setShowPeriodMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] transition-colors ${
                      period === key ? "font-medium text-[#333]" : "text-[#666]"
                    }`}
                  >
                    {PERIOD_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <AskRouteCFO prompt="Analyze my per-location profitability and identify underperformers" />
        </div>
      </div>

      {/* Custom Date Range */}
      {period === "custom" && (
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm text-[#666]">
            From
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="ml-2 rounded border border-[#e6e6e6] px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm text-[#666]">
            To
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="ml-2 rounded border border-[#e6e6e6] px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Gross Revenue" value={fmt(totals.grossRevenue)} />
        <SummaryCard
          label="Total Costs"
          value={fmt(totals.revShare + totals.inventoryCost + totals.laborCost)}
        />
        <SummaryCard
          label="Net Profit"
          value={fmt(totals.netProfit)}
          positive={totals.netProfit >= 0}
        />
        <SummaryCard
          label="Avg Margin"
          value={fmtPct(totalMargin)}
          positive={totalMargin >= 0}
        />
      </div>

      {/* P&L Table */}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e6e6e6]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e6e6e6] bg-[#fafafa]">
                <th className="px-4 py-3 text-left">
                  <SortHeader
                    label="Location"
                    column="locationName"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    align="left"
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Gross Revenue"
                    column="grossRevenue"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Rev Share"
                    column="revShare"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Inventory Cost"
                    column="inventoryCost"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Labor"
                    column="laborCost"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Net Profit"
                    column="netProfit"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Margin"
                    column="marginPct"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.locationId}
                  className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#333]">
                    {row.locationName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmtDetailed(row.grossRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                    {fmtDetailed(row.revShare)}
                    {row.revSharePct > 0 && (
                      <span className="ml-1 text-xs text-[#999]">
                        ({fmtPct(row.revSharePct)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                    {fmtDetailed(row.inventoryCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                    {fmtDetailed(row.laborCost)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      row.netProfit >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {fmtDetailed(row.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MarginBadge value={row.marginPct} />
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-[#f5f5f5] font-medium">
                <td className="px-4 py-3 text-[#333]">
                  Total ({rows.length} locations)
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {fmtDetailed(totals.grossRevenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                  {fmtDetailed(totals.revShare)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                  {fmtDetailed(totals.inventoryCost)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666]">
                  {fmtDetailed(totals.laborCost)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-medium ${
                    totals.netProfit >= 0 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {fmtDetailed(totals.netProfit)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MarginBadge value={totalMargin} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#e6e6e6] bg-white p-4">
      <p className="text-xs font-medium text-[#888] mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${
          positive === undefined
            ? "text-[#333]"
            : positive
              ? "text-green-700"
              : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MarginBadge({ value }: { value: number }) {
  let bgColor = "bg-green-100 text-green-700";
  if (value < 0) {
    bgColor = "bg-red-100 text-red-700";
  } else if (value < 20) {
    bgColor = "bg-yellow-100 text-yellow-700";
  } else if (value < 35) {
    bgColor = "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor}`}
    >
      {fmtPct(value)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-[#ddd] rounded-lg p-12 text-center">
      <Building2
        className="mx-auto mb-4 text-[#bbb]"
        size={40}
        strokeWidth={1.5}
      />
      <p className="text-sm font-medium text-[#555]">
        No location revenue data for this period
      </p>
      <p className="text-xs text-[#999] mt-1">
        Import revenue records or adjust the date range to see location
        profitability.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function getWeeksInPeriod(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string,
): number {
  const range = getPeriodRange(preset, customStart, customEnd);
  const start = new Date(range.start);
  const end = new Date(range.end);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
