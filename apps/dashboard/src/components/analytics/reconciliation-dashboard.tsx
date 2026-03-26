"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Scale,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

const ReconciliationTrendChart = dynamic(
  () =>
    import("./reconciliation-trend-chart").then(
      (mod) => mod.ReconciliationTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border border-dashed border-[#ddd] rounded-lg h-[300px] flex items-center justify-center">
        <p className="text-sm text-[#888]">Loading chart...</p>
      </div>
    ),
  },
);

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
}

interface ServerData {
  currentRevenue: any[];
  locations: any[];
  trendRevenue: any[];
}

interface LocationReconciliation {
  locationId: string;
  locationName: string;
  grossSales: number;
  cashRevenue: number;
  cardRevenue: number;
  processingFee: number;
  feePercent: number;
  netDeposit: number;
  variance: number;
}

type SortColumn = keyof Pick<
  LocationReconciliation,
  | "locationName"
  | "grossSales"
  | "cashRevenue"
  | "cardRevenue"
  | "processingFee"
  | "feePercent"
  | "netDeposit"
  | "variance"
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

function isInRange(
  record: RevenueRecord,
  range: { start: string; end: string },
): boolean {
  return record.period_start >= range.start && record.period_end <= range.end;
}

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

export function ReconciliationDashboard({
  teamId,
  serverData,
}: {
  teamId: string;
  serverData: ServerData;
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("variance");
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

  // Build location map
  const locationsMap = useMemo(() => {
    return new Map(
      (serverData.locations as LocationRow[]).map((l) => [l.id, l]),
    );
  }, [serverData.locations]);

  // Filter revenue records by selected period
  const filteredRecords = useMemo(() => {
    const range = getPeriodRange(period, customStart, customEnd);
    return (serverData.currentRevenue as RevenueRecord[]).filter((r) =>
      isInRange(r, range),
    );
  }, [serverData.currentRevenue, period, customStart, customEnd]);

  // All revenue records (for trend, used across all periods)
  const allRecords = useMemo(
    () => serverData.trendRevenue as RevenueRecord[],
    [serverData.trendRevenue],
  );

  // Compute summary totals
  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, rec) => ({
        gross: acc.gross + toNum(rec.gross_revenue),
        fees: acc.fees + toNum(rec.processing_fees),
        net: acc.net + toNum(rec.net_deposited),
        cash: acc.cash + toNum(rec.cash_revenue),
        card: acc.card + toNum(rec.card_revenue),
      }),
      { gross: 0, fees: 0, net: 0, cash: 0, card: 0 },
    );
  }, [filteredRecords]);

  const feeRate = totals.gross > 0 ? (totals.fees / totals.gross) * 100 : 0;

  // Per-location reconciliation rows
  const locationRows = useMemo(() => {
    const locationAgg = new Map<
      string,
      {
        gross: number;
        fees: number;
        net: number;
        cash: number;
        card: number;
      }
    >();

    for (const rec of filteredRecords) {
      const locId = rec.location_id ?? "unassigned";
      const existing = locationAgg.get(locId) ?? {
        gross: 0,
        fees: 0,
        net: 0,
        cash: 0,
        card: 0,
      };
      locationAgg.set(locId, {
        gross: existing.gross + toNum(rec.gross_revenue),
        fees: existing.fees + toNum(rec.processing_fees),
        net: existing.net + toNum(rec.net_deposited),
        cash: existing.cash + toNum(rec.cash_revenue),
        card: existing.card + toNum(rec.card_revenue),
      });
    }

    const rows: LocationReconciliation[] = [];
    for (const [locId, agg] of locationAgg) {
      const loc = locationsMap.get(locId);
      const feePercent = agg.gross > 0 ? (agg.fees / agg.gross) * 100 : 0;
      const expectedNet = agg.gross - agg.fees;
      const variance = agg.net - expectedNet;

      rows.push({
        locationId: locId,
        locationName: loc?.name ?? "Unassigned",
        grossSales: agg.gross,
        cashRevenue: agg.cash,
        cardRevenue: agg.card,
        processingFee: agg.fees,
        feePercent,
        netDeposit: agg.net,
        variance,
      });
    }

    return rows;
  }, [filteredRecords, locationsMap]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    return [...locationRows].sort((a, b) => {
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
  }, [locationRows, sortColumn, sortDirection]);

  // Monthly trend data for chart
  const trendData = useMemo(() => {
    const monthMap = new Map<
      string,
      { gross: number; net: number; fees: number }
    >();

    for (const rec of allRecords) {
      const date = new Date(rec.period_start);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthMap.get(key) ?? { gross: 0, net: 0, fees: 0 };
      monthMap.set(key, {
        gross: existing.gross + toNum(rec.gross_revenue),
        net: existing.net + toNum(rec.net_deposited),
        fees: existing.fees + toNum(rec.processing_fees),
      });
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month) - 1);
        return {
          month: date.toLocaleString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          ...vals,
        };
      });
  }, [allRecords]);

  // Fee analysis
  const feeAnalysis = useMemo(() => {
    if (locationRows.length === 0) {
      return {
        avgRate: 0,
        highestFeeLocation: null as LocationReconciliation | null,
        lowestFeeLocation: null as LocationReconciliation | null,
        totalFees: totals.fees,
        potentialSavings: 0,
      };
    }

    const withCards = locationRows.filter((r) => r.cardRevenue > 0);
    const avgRate =
      withCards.length > 0
        ? withCards.reduce((s, r) => s + r.feePercent, 0) / withCards.length
        : 0;

    const sorted = [...withCards].sort(
      (a, b) => b.feePercent - a.feePercent,
    );
    const highestFeeLocation = sorted[0] ?? null;
    const lowestFeeLocation = sorted[sorted.length - 1] ?? null;

    let potentialSavings = 0;
    if (
      highestFeeLocation &&
      lowestFeeLocation &&
      highestFeeLocation.locationId !== lowestFeeLocation.locationId
    ) {
      const feeGap =
        highestFeeLocation.feePercent - lowestFeeLocation.feePercent;
      potentialSavings =
        (feeGap / 100) * highestFeeLocation.cardRevenue;
    }

    return {
      avgRate,
      highestFeeLocation,
      lowestFeeLocation,
      totalFees: totals.fees,
      potentialSavings,
    };
  }, [locationRows, totals.fees]);

  // Reconciliation status counts
  const statusCounts = useMemo(() => {
    let reconciled = 0;
    let smallVariance = 0;
    let largeVariance = 0;

    for (const row of locationRows) {
      const absVar = Math.abs(row.variance);
      if (absVar < 0.01) {
        reconciled++;
      } else if (absVar < 10) {
        smallVariance++;
      } else {
        largeVariance++;
      }
    }

    return { reconciled, smallVariance, largeVariance };
  }, [locationRows]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale size={20} strokeWidth={1.5} className="text-[#666]" />
            <h1 className="text-2xl font-bold">Revenue Reconciliation</h1>
          </div>
          <p className="text-sm text-[#878787] mt-1">
            Compare gross sales against bank deposits. See exactly where the
            money goes.
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
                      period === key
                        ? "font-medium text-[#333]"
                        : "text-[#666]"
                    }`}
                  >
                    {PERIOD_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <AskRouteCFO prompt="Analyze my revenue reconciliation and identify discrepancies between gross sales and bank deposits" />
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

      {/* Section 1: Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="Gross Revenue" value={fmt(totals.gross)} />
        <SummaryCard
          label="Processing Fees"
          value={fmt(totals.fees)}
          negative
        />
        <SummaryCard label="Net Deposited" value={fmt(totals.net)} />
        <SummaryCard label="Fee Rate" value={fmtPct(feeRate)} />
        <SummaryCard
          label="Cash / Card"
          value={`${fmt(totals.cash)} / ${fmt(totals.card)}`}
        />
      </div>

      {/* Reconciliation Status */}
      {locationRows.length > 0 && (
        <div className="flex items-center gap-4 mb-6 text-xs">
          <div className="flex items-center gap-1.5 text-green-700">
            <CheckCircle2 size={14} />
            <span>{statusCounts.reconciled} reconciled</span>
          </div>
          {statusCounts.smallVariance > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-700">
              <AlertTriangle size={14} />
              <span>{statusCounts.smallVariance} small variance</span>
            </div>
          )}
          {statusCounts.largeVariance > 0 && (
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle size={14} />
              <span>{statusCounts.largeVariance} discrepancies</span>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Reconciliation Table */}
      {locationRows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e6e6e6] mb-8">
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
                    label="Gross Sales"
                    column="grossSales"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">
                  <SortHeader
                    label="Cash"
                    column="cashRevenue"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">
                  <SortHeader
                    label="Card"
                    column="cardRevenue"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Processing Fee"
                    column="processingFee"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">
                  <SortHeader
                    label="Fee %"
                    column="feePercent"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Net Deposit"
                    column="netDeposit"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader
                    label="Variance"
                    column="variance"
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
                    {fmtDetailed(row.grossSales)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden sm:table-cell">
                    {fmtDetailed(row.cashRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden sm:table-cell">
                    {fmtDetailed(row.cardRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">
                    -{fmtDetailed(row.processingFee)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden lg:table-cell">
                    {fmtPct(row.feePercent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {fmtDetailed(row.netDeposit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <VarianceBadge value={row.variance} />
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-[#f5f5f5] font-medium">
                <td className="px-4 py-3 text-[#333]">
                  Total ({locationRows.length} locations)
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {fmtDetailed(totals.gross)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden sm:table-cell">
                  {fmtDetailed(totals.cash)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden sm:table-cell">
                  {fmtDetailed(totals.card)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-red-600">
                  -{fmtDetailed(totals.fees)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#666] hidden lg:table-cell">
                  {fmtPct(feeRate)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {fmtDetailed(totals.net)}
                </td>
                <td className="px-4 py-3 text-right">
                  <VarianceBadge
                    value={totals.net - (totals.gross - totals.fees)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Section 3: Monthly Trend */}
      {trendData.length > 0 && (
        <div className="mb-8">
          <ReconciliationTrendChart data={trendData} />
        </div>
      )}

      {/* Section 4: Fee Analysis */}
      {locationRows.length > 0 && (
        <div className="rounded-lg border border-[#e6e6e6] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} strokeWidth={1.5} className="text-[#666]" />
            <h3 className="text-sm font-semibold text-[#333]">Fee Analysis</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <FeeAnalysisCard
              label="Average Fee Rate"
              value={fmtPct(feeAnalysis.avgRate)}
              sublabel="across all locations"
            />
            <FeeAnalysisCard
              label="Highest Fee Location"
              value={
                feeAnalysis.highestFeeLocation
                  ? fmtPct(feeAnalysis.highestFeeLocation.feePercent)
                  : "--"
              }
              sublabel={
                feeAnalysis.highestFeeLocation?.locationName ?? "N/A"
              }
            />
            <FeeAnalysisCard
              label="Total Fees Paid"
              value={fmtDetailed(feeAnalysis.totalFees)}
              sublabel="this period"
            />
            <FeeAnalysisCard
              label="Lowest Fee Location"
              value={
                feeAnalysis.lowestFeeLocation
                  ? fmtPct(feeAnalysis.lowestFeeLocation.feePercent)
                  : "--"
              }
              sublabel={
                feeAnalysis.lowestFeeLocation?.locationName ?? "N/A"
              }
            />
          </div>

          {feeAnalysis.potentialSavings > 1 &&
            feeAnalysis.highestFeeLocation &&
            feeAnalysis.lowestFeeLocation && (
              <div className="flex items-start gap-3 rounded-lg border border-[#e6e6e6] bg-[#fafafa] p-4 mt-2">
                <Lightbulb
                  size={16}
                  strokeWidth={1.5}
                  className="text-yellow-600 mt-0.5 shrink-0"
                />
                <p className="text-sm text-[#555]">
                  You could save{" "}
                  <span className="font-semibold text-[#333]">
                    {fmtDetailed(feeAnalysis.potentialSavings)}/period
                  </span>{" "}
                  by switching{" "}
                  <span className="font-medium">
                    {feeAnalysis.highestFeeLocation.locationName}
                  </span>{" "}
                  ({fmtPct(feeAnalysis.highestFeeLocation.feePercent)} fees) to
                  the same processor as{" "}
                  <span className="font-medium">
                    {feeAnalysis.lowestFeeLocation.locationName}
                  </span>{" "}
                  ({fmtPct(feeAnalysis.lowestFeeLocation.feePercent)} fees).
                </p>
              </div>
            )}
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
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#e6e6e6] bg-white p-4">
      <p className="text-xs font-medium text-[#888] mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${negative ? "text-red-600" : "text-[#333]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeeAnalysisCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-lg border border-[#e6e6e6] bg-[#fafafa] p-3">
      <p className="text-xs font-medium text-[#888] mb-1">{label}</p>
      <p className="text-base font-bold text-[#333]">{value}</p>
      <p className="text-xs text-[#999] mt-0.5">{sublabel}</p>
    </div>
  );
}

function VarianceBadge({ value }: { value: number }) {
  const absVal = Math.abs(value);

  let bgColor = "bg-green-100 text-green-700";
  let label = "Reconciled";

  if (absVal >= 10) {
    bgColor = "bg-red-100 text-red-700";
    label = fmtDetailed(value);
  } else if (absVal >= 0.01) {
    bgColor = "bg-yellow-100 text-yellow-700";
    label = fmtDetailed(value);
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor}`}
    >
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-[#ddd] rounded-lg p-12 text-center mb-8">
      <Building2
        className="mx-auto mb-4 text-[#bbb]"
        size={40}
        strokeWidth={1.5}
      />
      <p className="text-sm font-medium text-[#555]">
        No revenue data for this period
      </p>
      <p className="text-xs text-[#999] mt-1">
        Import revenue records or adjust the date range to see reconciliation
        data.
      </p>
    </div>
  );
}
