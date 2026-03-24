"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | null | undefined): number {
  return Number(val) || 0;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0] ?? "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapacityDashboard({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [employeeCapacities, setEmployeeCapacities] = useState<
    EmployeeCapacity[]
  >([]);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [recommendations, setRecommendations] = useState<
    HiringRecommendation[]
  >([]);
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    avgUtilization: 0,
    overCapacity: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const weekStart = getCurrentWeekStart();

      // Cast .from() for custom vending tables not in generated Supabase types
      const sb = supabase as any;

      const [employeesRes, weeklyPlanRes, scheduleRes, locationsRes, routesRes] =
        await Promise.all([
          sb
            .from("employees")
            .select("id, name, role, employment_type, max_weekly_hours, hourly_rate, is_active")
            .eq("business_id", teamId)
            .eq("is_active", true),
          sb
            .from("operator_weekly_plan")
            .select(
              "operator_id, planned_stops, planned_driving_hrs, planned_warehouse_hrs, planned_load_van_hrs, planned_stock_hrs, planned_pick_hrs",
            )
            .eq("business_id", teamId)
            .eq("week_start", weekStart),
          sb
            .from("service_schedule")
            .select("location_id, day_of_week, action")
            .eq("business_id", teamId),
          sb
            .from("locations")
            .select("id, route_id")
            .eq("business_id", teamId),
          sb
            .from("routes")
            .select("id, operator_id")
            .eq("business_id", teamId)
            .eq("is_active", true),
        ]);

      const employeesList = (employeesRes.data ?? []) as EmployeeRow[];
      const weeklyPlans = (weeklyPlanRes.data ?? []) as WeeklyPlanRow[];
      const schedules = (scheduleRes.data ?? []) as ServiceScheduleRow[];
      const locationsList = (locationsRes.data ?? []) as LocationRow[];
      const routesList = (routesRes.data ?? []) as RouteRow[];

      // Map operator_id -> user_id from routes, then from routes to locations
      // to figure out stops per operator
      const routeOperatorMap = new Map(
        routesList
          .filter((r) => r.operator_id)
          .map((r) => [r.id, r.operator_id!]),
      );

      // Map location -> route -> operator
      const locationRouteMap = new Map(
        locationsList
          .filter((l) => l.route_id)
          .map((l) => [l.id, l.route_id!]),
      );

      // Count weekly stops per operator from service_schedule
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

      // Aggregate weekly plan hours per employee
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

      // Build employee capacities
      const capacities: EmployeeCapacity[] = employeesList.map((emp) => {
        const maxHours = toNum(emp.max_weekly_hours);
        const planHours = planHoursMap.get(emp.id);
        const scheduleStops = operatorStopsMap.get(emp.id) ?? 0;

        // Use planned hours if available, otherwise estimate from schedule
        const avgTaskDuration = 1.5; // hours per stop (stock + pick + misc)
        const avgDrivingPerStop = 0.5; // driving time per stop

        const driving = planHours?.driving ?? scheduleStops * avgDrivingPerStop;
        const warehouse = planHours?.warehouse ?? 0;
        const loadVan = planHours?.loadVan ?? 0;
        const stock = planHours?.stock ?? scheduleStops * 0.75;
        const pick = planHours?.pick ?? scheduleStops * 0.5;
        const totalPlanned = driving + warehouse + loadVan + stock + pick;

        const utilization = maxHours > 0 ? (totalPlanned / maxHours) * 100 : 0;
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

      // Sort by utilization descending
      capacities.sort((a, b) => b.utilization - a.utilization);
      setEmployeeCapacities(capacities);

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
      setAlerts(newAlerts);

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
        const avgStopsPerEmployee =
          capacities.reduce((s, c) => s + c.assignedStopsPerWeek, 0) /
          capacities.length;
        const slotsBeforeOverload = capacities.reduce((s, c) => {
          const remainingHours = c.maxWeeklyHours - c.totalPlannedHours;
          const stopsFromRemaining = Math.floor(remainingHours / 2); // ~2h per stop
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

      setRecommendations(newRecs);

      // Summary stats
      setSummaryStats({
        totalEmployees: capacities.length,
        avgUtilization: avgUtil,
        overCapacity: overCapacityCount,
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
