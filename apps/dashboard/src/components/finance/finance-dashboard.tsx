"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MonthlyPnlSummary } from "./monthly-pnl-summary";
import { RevenueByLocationTable } from "./revenue-by-location-table";
import { RevenueByRouteTable } from "./revenue-by-route-table";
import { RevenueOverviewCards } from "./revenue-overview-cards";
import { RevenueTrendChart } from "./revenue-trend-chart";

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
  monthly_rent: string | null;
}

interface RouteRow {
  id: string;
  name: string;
}

interface PlanRow {
  planned_driving_hrs: string | null;
  planned_warehouse_hrs: string | null;
  planned_load_van_hrs: string | null;
  planned_stock_hrs: string | null;
  planned_pick_hrs: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | null | undefined): number {
  return Number(val) || 0;
}

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function monthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FinanceDashboard({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({
    grossRevenue: 0,
    processingFees: 0,
    netDeposited: 0,
    prevGrossRevenue: 0,
    prevProcessingFees: 0,
    prevNetDeposited: 0,
  });
  const [locationData, setLocationData] = useState<
    Array<{
      locationId: string;
      locationName: string;
      grossRevenue: number;
      processingFees: number;
      netDeposited: number;
      transactionCount: number;
      prevGrossRevenue: number;
      prevNetDeposited: number;
    }>
  >([]);
  const [routeData, setRouteData] = useState<
    Array<{
      routeName: string;
      totalGross: number;
      totalNet: number;
      locationCount: number;
      avgRevenuePerLocation: number;
    }>
  >([]);
  const [trendData, setTrendData] = useState<
    Array<{ month: string; gross: number; net: number; fees: number }>
  >([]);
  const [pnlData, setPnlData] = useState({
    grossRevenue: 0,
    processingFees: 0,
    laborCosts: 0,
    operatingExpenses: 0,
    rent: 0,
    insurance: 0,
    otherExpenses: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const currentMonth = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      // Fetch all data in parallel
      // Cast .from() for custom vending tables not in generated Supabase types
      const sb = supabase as any;

      const [
        currentRevRes,
        prevRevRes,
        locationsRes,
        routesRes,
        trendRevRes,
        weeklyPlanRes,
      ] = await Promise.all([
        sb
          .from("revenue_records")
          .select("*")
          .eq("business_id", teamId)
          .gte("period_start", currentMonth.start)
          .lte("period_end", currentMonth.end),
        sb
          .from("revenue_records")
          .select("*")
          .eq("business_id", teamId)
          .gte("period_start", prevMonth.start)
          .lte("period_end", prevMonth.end),
        sb
          .from("locations")
          .select("id, name, route_id, monthly_rent")
          .eq("business_id", teamId),
        sb
          .from("routes")
          .select("id, name")
          .eq("business_id", teamId)
          .eq("is_active", true),
        // Last 6 months of revenue for trend
        sb
          .from("revenue_records")
          .select("*")
          .eq("business_id", teamId)
          .gte("period_start", getMonthRange(-5).start)
          .order("period_start", { ascending: true }),
        // Weekly plan for labor cost estimate
        sb
          .from("operator_weekly_plan")
          .select(
            "planned_driving_hrs, planned_warehouse_hrs, planned_load_van_hrs, planned_stock_hrs, planned_pick_hrs",
          )
          .eq("business_id", teamId)
          .gte("week_start", currentMonth.start)
          .lte("week_start", currentMonth.end),
      ]);

      const currentRecords = (currentRevRes.data ?? []) as RevenueRecord[];
      const prevRecords = (prevRevRes.data ?? []) as RevenueRecord[];
      const locationsMap = new Map(
        ((locationsRes.data ?? []) as LocationRow[]).map((l: LocationRow) => [l.id, l]),
      );
      const routesMap = new Map(
        ((routesRes.data ?? []) as RouteRow[]).map((r: RouteRow) => [r.id, r]),
      );
      const allTrendRecords = (trendRevRes.data ?? []) as RevenueRecord[];
      const weeklyPlans = (weeklyPlanRes.data ?? []) as PlanRow[];

      // -- Overview cards --
      const totalGross = currentRecords.reduce(
        (s, r) => s + toNum(r.gross_revenue),
        0,
      );
      const totalFees = currentRecords.reduce(
        (s, r) => s + toNum(r.processing_fees),
        0,
      );
      const totalNet = currentRecords.reduce(
        (s, r) => s + toNum(r.net_deposited),
        0,
      );
      const prevGross = prevRecords.reduce(
        (s, r) => s + toNum(r.gross_revenue),
        0,
      );
      const prevFees = prevRecords.reduce(
        (s, r) => s + toNum(r.processing_fees),
        0,
      );
      const prevNet = prevRecords.reduce(
        (s, r) => s + toNum(r.net_deposited),
        0,
      );

      setOverviewData({
        grossRevenue: totalGross,
        processingFees: totalFees,
        netDeposited: totalNet,
        prevGrossRevenue: prevGross,
        prevProcessingFees: prevFees,
        prevNetDeposited: prevNet,
      });

      // -- Revenue by location --
      const locationRevMap = new Map<
        string,
        {
          gross: number;
          fees: number;
          net: number;
          txns: number;
        }
      >();
      const prevLocationRevMap = new Map<string, { gross: number; net: number }>();

      for (const rec of currentRecords) {
        if (!rec.location_id) continue;
        const existing = locationRevMap.get(rec.location_id) ?? {
          gross: 0,
          fees: 0,
          net: 0,
          txns: 0,
        };
        locationRevMap.set(rec.location_id, {
          gross: existing.gross + toNum(rec.gross_revenue),
          fees: existing.fees + toNum(rec.processing_fees),
          net: existing.net + toNum(rec.net_deposited),
          txns: existing.txns + (rec.transaction_count ?? 0),
        });
      }

      for (const rec of prevRecords) {
        if (!rec.location_id) continue;
        const existing = prevLocationRevMap.get(rec.location_id) ?? {
          gross: 0,
          net: 0,
        };
        prevLocationRevMap.set(rec.location_id, {
          gross: existing.gross + toNum(rec.gross_revenue),
          net: existing.net + toNum(rec.net_deposited),
        });
      }

      const locationRows = Array.from(locationRevMap.entries()).map(
        ([locId, rev]) => {
          const loc = locationsMap.get(locId);
          const prev = prevLocationRevMap.get(locId);
          return {
            locationId: locId,
            locationName: loc?.name ?? "Unknown",
            grossRevenue: rev.gross,
            processingFees: rev.fees,
            netDeposited: rev.net,
            transactionCount: rev.txns,
            prevGrossRevenue: prev?.gross ?? 0,
            prevNetDeposited: prev?.net ?? 0,
          };
        },
      );
      setLocationData(locationRows);

      // -- Revenue by route --
      const routeRevMap = new Map<
        string,
        { gross: number; net: number; locationIds: Set<string> }
      >();

      for (const rec of currentRecords) {
        if (!rec.location_id) continue;
        const loc = locationsMap.get(rec.location_id);
        const routeId = loc?.route_id;
        if (!routeId) continue;

        const existing = routeRevMap.get(routeId) ?? {
          gross: 0,
          net: 0,
          locationIds: new Set<string>(),
        };
        existing.gross += toNum(rec.gross_revenue);
        existing.net += toNum(rec.net_deposited);
        existing.locationIds.add(rec.location_id);
        routeRevMap.set(routeId, existing);
      }

      const routeRows = Array.from(routeRevMap.entries()).map(
        ([routeId, rev]) => {
          const route = routesMap.get(routeId);
          const locCount = rev.locationIds.size;
          return {
            routeName: route?.name ?? "Unassigned",
            totalGross: rev.gross,
            totalNet: rev.net,
            locationCount: locCount,
            avgRevenuePerLocation: locCount > 0 ? rev.gross / locCount : 0,
          };
        },
      );
      setRouteData(routeRows);

      // -- Trend data (last 6 months) --
      const trendMap = new Map<
        string,
        { gross: number; net: number; fees: number }
      >();

      for (const rec of allTrendRecords) {
        const monthKey = rec.period_start.substring(0, 7); // YYYY-MM
        const existing = trendMap.get(monthKey) ?? {
          gross: 0,
          net: 0,
          fees: 0,
        };
        trendMap.set(monthKey, {
          gross: existing.gross + toNum(rec.gross_revenue),
          net: existing.net + toNum(rec.net_deposited),
          fees: existing.fees + toNum(rec.processing_fees),
        });
      }

      // Ensure we have entries for the last 6 months even if no data
      const trendEntries: Array<{
        month: string;
        gross: number;
        net: number;
        fees: number;
      }> = [];

      for (let i = -5; i <= 0; i++) {
        const label = monthLabel(i);
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = trendMap.get(key);
        trendEntries.push({
          month: label,
          gross: entry?.gross ?? 0,
          net: entry?.net ?? 0,
          fees: entry?.fees ?? 0,
        });
      }
      setTrendData(trendEntries);

      // -- P&L --
      const avgHourlyRate = 25; // Default; could be fetched from operator_rates
      let totalLaborHrs = 0;
      for (const plan of weeklyPlans) {
        totalLaborHrs +=
          toNum(plan.planned_driving_hrs) +
          toNum(plan.planned_warehouse_hrs) +
          toNum(plan.planned_load_van_hrs) +
          toNum(plan.planned_stock_hrs) +
          toNum(plan.planned_pick_hrs);
      }
      const laborCosts = totalLaborHrs * avgHourlyRate;

      const totalRent = Array.from(locationsMap.values()).reduce(
        (s, l) => s + toNum(l.monthly_rent),
        0,
      );

      setPnlData({
        grossRevenue: totalGross,
        processingFees: totalFees,
        laborCosts,
        operatingExpenses: totalRent,
        rent: totalRent,
        insurance: 0,
        otherExpenses: 0,
      });

      setLoading(false);
    }

    fetchData();
  }, [supabase, teamId]);

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
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-sm text-[#878787] mt-1">
            Revenue, expenses, and profitability at a glance.
          </p>
        </div>
        <AskRouteCFO prompt="Analyze my revenue trends and identify growth opportunities" />
      </div>

      {/* Revenue Overview Cards */}
      <div className="mb-8">
        <RevenueOverviewCards data={overviewData} />
      </div>

      {/* Revenue Trend Chart */}
      <div className="mb-8">
        <RevenueTrendChart data={trendData} />
      </div>

      {/* Revenue by Location */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Revenue by Location</h2>
        <RevenueByLocationTable data={locationData} />
      </div>

      {/* Revenue by Route */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Revenue by Route</h2>
        <RevenueByRouteTable data={routeData} />
      </div>

      {/* Monthly P&L */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Profit & Loss</h2>
        <MonthlyPnlSummary data={pnlData} />
      </div>
    </div>
  );
}
