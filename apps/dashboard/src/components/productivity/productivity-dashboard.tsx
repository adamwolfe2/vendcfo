"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { OperatorProductivityTable } from "./operator-productivity-table";
import { ProductivitySummaryCards } from "./productivity-summary-cards";
import { WeeklyComparisonChart } from "./weekly-comparison-chart";
import { TimeEntryLog } from "./time-entry-log";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OperatorProductivity {
  operatorId: string;
  name: string;
  role: string;
  plannedStops: number;
  actualStops: number;
  stopsVariance: number;
  plannedDrivingHrs: number;
  actualDrivingHrs: number;
  plannedWarehouseHrs: number;
  actualWarehouseHrs: number;
  plannedLoadVanHrs: number;
  actualLoadVanHrs: number;
  plannedStockHrs: number;
  actualStockHrs: number;
  plannedPickHrs: number;
  actualPickHrs: number;
  totalPlannedHrs: number;
  totalActualHrs: number;
  hoursVariance: number;
  efficiencyScore: number;
}

export interface DailyComparison {
  dayLabel: string;
  dayOfWeek: number;
  plannedHrs: number;
  actualHrs: number;
}

interface WeeklyPlanRow {
  operator_id: string;
  day_of_week: number;
  planned_stops: number | null;
  planned_driving_hrs: string | null;
  planned_warehouse_hrs: string | null;
  planned_load_van_hrs: string | null;
  planned_stock_hrs: string | null;
  planned_pick_hrs: string | null;
  actual_stops: number | null;
  actual_driving_hrs: string | null;
  actual_warehouse_hrs: string | null;
  actual_load_van_hrs: string | null;
  actual_stock_hrs: string | null;
  actual_pick_hrs: string | null;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | null | undefined): number {
  return Number(val) || 0;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0] ?? "";
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductivityDashboard({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<OperatorProductivity[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(
    null,
  );
  const [dailyData, setDailyData] = useState<
    Record<string, DailyComparison[]>
  >({});
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanRow[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const weekStart = getCurrentWeekStart();
      const sb = supabase as any;

      const [employeesRes, weeklyPlanRes] = await Promise.all([
        sb
          .from("employees")
          .select("id, name, role, is_active")
          .eq("business_id", teamId)
          .eq("is_active", true),
        sb
          .from("operator_weekly_plan")
          .select(
            "operator_id, day_of_week, planned_stops, planned_driving_hrs, planned_warehouse_hrs, planned_load_van_hrs, planned_stock_hrs, planned_pick_hrs, actual_stops, actual_driving_hrs, actual_warehouse_hrs, actual_load_van_hrs, actual_stock_hrs, actual_pick_hrs",
          )
          .eq("business_id", teamId)
          .eq("week_start", weekStart),
      ]);

      const employeesList = (employeesRes.data ?? []) as EmployeeRow[];
      const plans = (weeklyPlanRes.data ?? []) as WeeklyPlanRow[];
      setWeeklyPlans(plans);

      // Build per-operator aggregation
      const operatorMap = new Map<
        string,
        {
          plannedStops: number;
          actualStops: number;
          plannedDriving: number;
          actualDriving: number;
          plannedWarehouse: number;
          actualWarehouse: number;
          plannedLoadVan: number;
          actualLoadVan: number;
          plannedStock: number;
          actualStock: number;
          plannedPick: number;
          actualPick: number;
        }
      >();

      // Build per-operator daily breakdown
      const dailyMap: Record<string, DailyComparison[]> = {};

      for (const plan of plans) {
        const existing = operatorMap.get(plan.operator_id) ?? {
          plannedStops: 0,
          actualStops: 0,
          plannedDriving: 0,
          actualDriving: 0,
          plannedWarehouse: 0,
          actualWarehouse: 0,
          plannedLoadVan: 0,
          actualLoadVan: 0,
          plannedStock: 0,
          actualStock: 0,
          plannedPick: 0,
          actualPick: 0,
        };

        operatorMap.set(plan.operator_id, {
          plannedStops: existing.plannedStops + (plan.planned_stops ?? 0),
          actualStops: existing.actualStops + (plan.actual_stops ?? 0),
          plannedDriving:
            existing.plannedDriving + toNum(plan.planned_driving_hrs),
          actualDriving:
            existing.actualDriving + toNum(plan.actual_driving_hrs),
          plannedWarehouse:
            existing.plannedWarehouse + toNum(plan.planned_warehouse_hrs),
          actualWarehouse:
            existing.actualWarehouse + toNum(plan.actual_warehouse_hrs),
          plannedLoadVan:
            existing.plannedLoadVan + toNum(plan.planned_load_van_hrs),
          actualLoadVan:
            existing.actualLoadVan + toNum(plan.actual_load_van_hrs),
          plannedStock: existing.plannedStock + toNum(plan.planned_stock_hrs),
          actualStock: existing.actualStock + toNum(plan.actual_stock_hrs),
          plannedPick: existing.plannedPick + toNum(plan.planned_pick_hrs),
          actualPick: existing.actualPick + toNum(plan.actual_pick_hrs),
        });

        // Daily data
        if (!dailyMap[plan.operator_id]) {
          dailyMap[plan.operator_id] = DAY_LABELS.map((label, i) => ({
            dayLabel: label,
            dayOfWeek: i,
            plannedHrs: 0,
            actualHrs: 0,
          }));
        }
        const dayIndex = plan.day_of_week;
        if (dayIndex >= 0 && dayIndex < DAY_LABELS.length) {
          const dayPlanned =
            toNum(plan.planned_driving_hrs) +
            toNum(plan.planned_warehouse_hrs) +
            toNum(plan.planned_load_van_hrs) +
            toNum(plan.planned_stock_hrs) +
            toNum(plan.planned_pick_hrs);
          const dayActual =
            toNum(plan.actual_driving_hrs) +
            toNum(plan.actual_warehouse_hrs) +
            toNum(plan.actual_load_van_hrs) +
            toNum(plan.actual_stock_hrs) +
            toNum(plan.actual_pick_hrs);

          const dayEntry = dailyMap[plan.operator_id]?.[dayIndex];
          if (dayEntry) {
            dailyMap[plan.operator_id] = dailyMap[plan.operator_id]!.map(
              (d, i) =>
                i === dayIndex
                  ? {
                      ...d,
                      plannedHrs: d.plannedHrs + dayPlanned,
                      actualHrs: d.actualHrs + dayActual,
                    }
                  : d,
            );
          }
        }
      }

      setDailyData(dailyMap);

      // Build operator productivity rows
      const productivityRows: OperatorProductivity[] = employeesList.map(
        (emp) => {
          const agg = operatorMap.get(emp.id);
          const totalPlanned = agg
            ? agg.plannedDriving +
              agg.plannedWarehouse +
              agg.plannedLoadVan +
              agg.plannedStock +
              agg.plannedPick
            : 0;
          const totalActual = agg
            ? agg.actualDriving +
              agg.actualWarehouse +
              agg.actualLoadVan +
              agg.actualStock +
              agg.actualPick
            : 0;
          const hoursVariance = totalActual - totalPlanned;
          const efficiencyScore =
            totalPlanned > 0
              ? Math.round((totalActual / totalPlanned) * 100)
              : 0;

          return {
            operatorId: emp.id,
            name: emp.name,
            role: emp.role ?? "Route Operator",
            plannedStops: agg?.plannedStops ?? 0,
            actualStops: agg?.actualStops ?? 0,
            stopsVariance: (agg?.actualStops ?? 0) - (agg?.plannedStops ?? 0),
            plannedDrivingHrs: agg?.plannedDriving ?? 0,
            actualDrivingHrs: agg?.actualDriving ?? 0,
            plannedWarehouseHrs: agg?.plannedWarehouse ?? 0,
            actualWarehouseHrs: agg?.actualWarehouse ?? 0,
            plannedLoadVanHrs: agg?.plannedLoadVan ?? 0,
            actualLoadVanHrs: agg?.actualLoadVan ?? 0,
            plannedStockHrs: agg?.plannedStock ?? 0,
            actualStockHrs: agg?.actualStock ?? 0,
            plannedPickHrs: agg?.plannedPick ?? 0,
            actualPickHrs: agg?.actualPick ?? 0,
            totalPlannedHrs: totalPlanned,
            totalActualHrs: totalActual,
            hoursVariance,
            efficiencyScore,
          };
        },
      );

      // Sort by efficiency score descending, operators with data first
      productivityRows.sort((a, b) => {
        if (a.totalPlannedHrs === 0 && b.totalPlannedHrs > 0) return 1;
        if (b.totalPlannedHrs === 0 && a.totalPlannedHrs > 0) return -1;
        return b.efficiencyScore - a.efficiencyScore;
      });

      setOperators(productivityRows);

      // Select first operator with data by default
      const firstWithData = productivityRows.find(
        (op) => op.totalPlannedHrs > 0 || op.totalActualHrs > 0,
      );
      if (firstWithData) {
        setSelectedOperatorId(firstWithData.operatorId);
      } else if (productivityRows.length > 0) {
        setSelectedOperatorId(productivityRows[0]?.operatorId ?? null);
      }

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

  if (!loading && operators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] border border-border rounded-lg">
        <Activity size={32} className="text-[#878787] mb-4" />
        <p className="font-medium mb-1">No operator data found for this week.</p>
        <p className="text-sm text-[#878787]">
          Assign operators to routes to see productivity tracking.
        </p>
      </div>
    );
  }

  const selectedOperator = operators.find(
    (op) => op.operatorId === selectedOperatorId,
  );
  const selectedDailyData = selectedOperatorId
    ? (dailyData[selectedOperatorId] ?? [])
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Operator Productivity</h1>
          <p className="text-sm text-[#878787] mt-1">
            Planned vs actual hours per operator, efficiency scores, and time
            tracking.
          </p>
        </div>
        <AskRouteCFO prompt="Analyze operator productivity this week and identify who is over or under their planned hours" />
      </div>

      {/* Summary Cards */}
      <ProductivitySummaryCards operators={operators} />

      {/* Per-Operator Productivity Table */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">
          Per-Operator Productivity
        </h2>
        <OperatorProductivityTable
          data={operators}
          selectedOperatorId={selectedOperatorId}
          onSelectOperator={setSelectedOperatorId}
        />
      </div>

      {/* Weekly Comparison Chart */}
      {selectedOperator && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-medium">Weekly Hours Comparison</h2>
            <select
              value={selectedOperatorId ?? ""}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="text-sm border border-[#d0d0d0] rounded-lg px-3 py-1.5 bg-white text-[#333]"
            >
              {operators.map((op) => (
                <option key={op.operatorId} value={op.operatorId}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
          <WeeklyComparisonChart
            data={selectedDailyData}
            operatorName={selectedOperator.name}
          />
        </div>
      )}

      {/* Time Entry Log */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Time Entry Log</h2>
        <TimeEntryLog weeklyPlans={weeklyPlans} operators={operators} />
      </div>
    </div>
  );
}
