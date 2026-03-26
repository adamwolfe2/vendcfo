"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { Users } from "lucide-react";
import { useMemo } from "react";
import {
  CapacityAlertCards,
  HiringRecommendations,
} from "./capacity-alert-cards";
import { EmployeeCapacityTable } from "./employee-capacity-table";
import { UtilizationBar } from "./utilization-bar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeRow {
  id: string;
  name: string;
  role: string | null;
  employment_type: string;
  max_weekly_hours: string;
  hourly_rate: string;
  is_active: boolean;
}

interface WeeklyPlanRow {
  operator_id: string;
  planned_stops: number | null;
  planned_driving_hrs: string | null;
  planned_warehouse_hrs: string | null;
  planned_load_van_hrs: string | null;
  planned_stock_hrs: string | null;
  planned_pick_hrs: string | null;
}

interface ServiceScheduleRow {
  location_id: string;
  day_of_week: number;
  action: string;
}

interface LocationRow {
  id: string;
  route_id: string | null;
}

interface RouteRow {
  id: string;
  operator_id: string | null;
}

interface EmployeeCapacity {
  employeeId: string;
  name: string;
  role: string;
  employmentType: string;
  assignedStopsPerWeek: number;
  maxWeeklyHours: number;
  totalPlannedHours: number;
  drivingHours: number;
  warehouseHours: number;
  loadVanHours: number;
  stockHours: number;
  pickHours: number;
  utilization: number;
}

interface CapacityAlert {
  employeeName: string;
  alertType: "approaching" | "at_capacity" | "over_capacity";
  utilization: number;
  message: string;
}

interface HiringRecommendation {
  message: string;
  urgency: "low" | "medium" | "high";
}

interface ServerData {
  employees: any[];
  weeklyPlans: any[];
  schedules: any[];
  locations: any[];
  routes: any[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | null | undefined): number {
  return Number(val) || 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapacityDashboard({
  teamId,
  serverData,
}: {
  teamId: string;
  serverData: ServerData;
}) {
  const { employeeCapacities, alerts, recommendations, summaryStats } =
    useMemo(() => {
      const employeesList = (serverData.employees ?? []) as EmployeeRow[];
      const weeklyPlans = (serverData.weeklyPlans ?? []) as WeeklyPlanRow[];
      const schedules = (serverData.schedules ?? []) as ServiceScheduleRow[];
      const locationsList = (serverData.locations ?? []) as LocationRow[];
      const routesList = (serverData.routes ?? []) as RouteRow[];

      const routeOperatorMap = new Map(
        routesList
          .filter((r) => r.operator_id)
          .map((r) => [r.id, r.operator_id!]),
      );

      const locationRouteMap = new Map(
        locationsList
          .filter((l) => l.route_id)
          .map((l) => [l.id, l.route_id!]),
      );

      const operatorStopsMap = new Map<string, number>();
      for (const sched of schedules) {
        if (sched.action === "nothing") continue;
        const routeId = locationRouteMap.get(sched.location_id);
        if (!routeId) continue;
        const operatorId = routeOperatorMap.get(routeId);
        if (!operatorId) continue;
        const current = operatorStopsMap.get(operatorId) ?? 0;
        operatorStopsMap.set(operatorId, current + 1);
      }

      const planHoursMap = new Map<
        string,
        {
          stops: number;
          driving: number;
          warehouse: number;
          loadVan: number;
          stock: number;
          pick: number;
        }
      >();

      for (const plan of weeklyPlans) {
        const existing = planHoursMap.get(plan.operator_id) ?? {
          stops: 0,
          driving: 0,
          warehouse: 0,
          loadVan: 0,
          stock: 0,
          pick: 0,
        };
        planHoursMap.set(plan.operator_id, {
          stops: existing.stops + (plan.planned_stops ?? 0),
          driving: existing.driving + toNum(plan.planned_driving_hrs),
          warehouse: existing.warehouse + toNum(plan.planned_warehouse_hrs),
          loadVan: existing.loadVan + toNum(plan.planned_load_van_hrs),
          stock: existing.stock + toNum(plan.planned_stock_hrs),
          pick: existing.pick + toNum(plan.planned_pick_hrs),
        });
      }

      const capacities: EmployeeCapacity[] = employeesList.map((emp) => {
        const maxHours = toNum(emp.max_weekly_hours);
        const planHours = planHoursMap.get(emp.id);
        const scheduleStops = operatorStopsMap.get(emp.id) ?? 0;

        const avgDrivingPerStop = 0.5;

        const driving = planHours?.driving ?? scheduleStops * avgDrivingPerStop;
        const warehouse = planHours?.warehouse ?? 0;
        const loadVan = planHours?.loadVan ?? 0;
        const stock = planHours?.stock ?? scheduleStops * 0.75;
        const pick = planHours?.pick ?? scheduleStops * 0.5;
        const totalPlanned = driving + warehouse + loadVan + stock + pick;

        const utilization =
          maxHours > 0 ? (totalPlanned / maxHours) * 100 : 0;
        const stops = planHours?.stops ?? scheduleStops;

        return {
          employeeId: emp.id,
          name: emp.name,
          role: emp.role ?? "Route Operator",
          employmentType: emp.employment_type,
          assignedStopsPerWeek: stops,
          maxWeeklyHours: maxHours,
          totalPlannedHours: totalPlanned,
          drivingHours: driving,
          warehouseHours: warehouse,
          loadVanHours: loadVan,
          stockHours: stock,
          pickHours: pick,
          utilization,
        };
      });

      capacities.sort((a, b) => b.utilization - a.utilization);

      // Generate alerts
      const newAlerts: CapacityAlert[] = [];
      for (const cap of capacities) {
        if (cap.utilization >= 100) {
          newAlerts.push({
            employeeName: cap.name,
            alertType: "over_capacity",
            utilization: cap.utilization,
            message: `${cap.name} is over capacity at ${cap.utilization.toFixed(0)}% utilization (${cap.totalPlannedHours.toFixed(1)}h planned vs ${cap.maxWeeklyHours}h max). Reassign stops or adjust schedule.`,
          });
        } else if (cap.utilization >= 85) {
          newAlerts.push({
            employeeName: cap.name,
            alertType: "at_capacity",
            utilization: cap.utilization,
            message: `${cap.name} is near capacity at ${cap.utilization.toFixed(0)}% utilization. Adding more stops may cause delays.`,
          });
        } else if (cap.utilization >= 70) {
          newAlerts.push({
            employeeName: cap.name,
            alertType: "approaching",
            utilization: cap.utilization,
            message: `${cap.name} is approaching capacity at ${cap.utilization.toFixed(0)}% utilization. Monitor closely before adding locations.`,
          });
        }
      }

      // Generate hiring recommendations
      const newRecs: HiringRecommendation[] = [];
      const overCapacityCount = capacities.filter(
        (c) => c.utilization >= 85,
      ).length;
      const avgUtil =
        capacities.length > 0
          ? capacities.reduce((s, c) => s + c.utilization, 0) /
            capacities.length
          : 0;

      if (overCapacityCount > 0) {
        newRecs.push({
          message: `${overCapacityCount} employee${overCapacityCount > 1 ? "s are" : " is"} at or over 85% capacity. Start interviewing for a new route operator to avoid service delays.`,
          urgency: "high",
        });
      }

      if (avgUtil > 75 && capacities.length > 0) {
        const slotsBeforeOverload = capacities.reduce((s, c) => {
          const remainingHours = c.maxWeeklyHours - c.totalPlannedHours;
          const stopsFromRemaining = Math.floor(remainingHours / 2);
          return s + Math.max(0, stopsFromRemaining);
        }, 0);

        newRecs.push({
          message: `Team average utilization is ${avgUtil.toFixed(0)}%. You can add approximately ${slotsBeforeOverload} more stops before exceeding capacity. Plan hiring accordingly.`,
          urgency: avgUtil > 85 ? "high" : "medium",
        });
      }

      if (capacities.length === 0) {
        newRecs.push({
          message:
            "No active employees found. Add employees to start tracking capacity and planning staffing needs.",
          urgency: "low",
        });
      }

      return {
        employeeCapacities: capacities,
        alerts: newAlerts,
        recommendations: newRecs,
        summaryStats: {
          totalEmployees: capacities.length,
          avgUtilization: avgUtil,
          overCapacity: overCapacityCount,
        },
      };
    }, [serverData]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Capacity Planning</h1>
          <p className="text-sm text-[#878787] mt-1">
            Employee utilization, workload distribution, and staffing
            recommendations.
          </p>
        </div>
        <AskRouteCFO prompt="Analyze our team capacity and recommend staffing changes" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} strokeWidth={1.5} className="text-[#999]" />
            <span className="text-xs text-[#878787] font-medium">
              Active Employees
            </span>
          </div>
          <p className="text-2xl font-bold">{summaryStats.totalEmployees}</p>
        </div>
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#878787] font-medium">
              Avg Utilization
            </span>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold">
              {summaryStats.avgUtilization.toFixed(0)}%
            </p>
          </div>
          <UtilizationBar
            utilization={summaryStats.avgUtilization}
            showLabel={false}
          />
        </div>
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#878787] font-medium">
              At/Over Capacity
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              summaryStats.overCapacity > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {summaryStats.overCapacity}
          </p>
          <p className="text-xs text-[#888] mt-1">
            {summaryStats.overCapacity > 0
              ? "employees need attention"
              : "all employees within capacity"}
          </p>
        </div>
      </div>

      {/* Capacity Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Capacity Alerts</h2>
          <CapacityAlertCards alerts={alerts} />
        </div>
      )}

      {/* Employee Capacity Table */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Employee Utilization</h2>
        <EmployeeCapacityTable data={employeeCapacities} />
      </div>

      {/* Hiring Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Staffing Insights</h2>
          <HiringRecommendations recommendations={recommendations} />
        </div>
      )}
    </div>
  );
}
