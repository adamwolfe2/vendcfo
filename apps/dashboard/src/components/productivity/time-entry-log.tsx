"use client";

import type { OperatorProductivity } from "./productivity-dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface TimeEntry {
  operatorName: string;
  day: string;
  category: string;
  plannedHrs: number;
  actualHrs: number;
  variance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const CATEGORIES = [
  { key: "driving", planned: "planned_driving_hrs", actual: "actual_driving_hrs", label: "Driving" },
  { key: "warehouse", planned: "planned_warehouse_hrs", actual: "actual_warehouse_hrs", label: "Warehouse" },
  { key: "load_van", planned: "planned_load_van_hrs", actual: "actual_load_van_hrs", label: "Load Van" },
  { key: "stock", planned: "planned_stock_hrs", actual: "actual_stock_hrs", label: "Stocking" },
  { key: "pick", planned: "planned_pick_hrs", actual: "actual_pick_hrs", label: "Picking" },
] as const;

function toNum(val: string | null | undefined): number {
  return Number(val) || 0;
}

function varianceColor(variance: number): string {
  if (variance > 0.25) return "text-red-600";
  if (variance < -0.25) return "text-green-600";
  return "text-[#333]";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  weeklyPlans: WeeklyPlanRow[];
  operators: OperatorProductivity[];
}

export function TimeEntryLog({ weeklyPlans, operators }: Props) {
  const operatorNameMap = new Map(
    operators.map((op) => [op.operatorId, op.name]),
  );

  // Build flat time entry log from weekly plan rows that have actual data
  const entries: TimeEntry[] = [];

  for (const plan of weeklyPlans) {
    const operatorName =
      operatorNameMap.get(plan.operator_id) ?? "Unknown Operator";
    const dayLabel = DAY_LABELS[plan.day_of_week] ?? `Day ${plan.day_of_week}`;

    for (const cat of CATEGORIES) {
      const planned = toNum(
        plan[cat.planned as keyof WeeklyPlanRow] as string | null,
      );
      const actual = toNum(
        plan[cat.actual as keyof WeeklyPlanRow] as string | null,
      );

      // Only include rows where there is some data
      if (planned > 0 || actual > 0) {
        entries.push({
          operatorName,
          day: dayLabel,
          category: cat.label,
          plannedHrs: planned,
          actualHrs: actual,
          variance: actual - planned,
        });
      }
    }
  }

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
        <p className="text-sm text-[#888]">
          No time entries recorded this week. Actual hours will appear here once
          operators log their time or actuals are entered in the weekly plan.
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
              <th className="text-left px-4 py-3 text-xs font-medium text-[#666]">
                Operator
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#666]">
                Day
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#666]">
                Category
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Planned
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Actual
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Variance
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr
                key={`${entry.operatorName}-${entry.day}-${entry.category}-${idx}`}
                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="px-4 py-2.5 text-sm">{entry.operatorName}</td>
                <td className="px-4 py-2.5 text-sm text-[#555]">
                  {entry.day}
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-[#555]">
                    {entry.category}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {entry.plannedHrs.toFixed(1)}h
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {entry.actualHrs.toFixed(1)}h
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-medium ${varianceColor(entry.variance)}`}
                >
                  {entry.variance > 0 ? "+" : ""}
                  {entry.variance.toFixed(1)}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-3">
        <p className="text-xs text-[#888]">
          Showing {entries.length} time entries for the current week. Variance
          is actual minus planned (green = under plan, red = over plan).
        </p>
      </div>
    </div>
  );
}
