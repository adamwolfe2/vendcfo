import { CapacityDashboard } from "@/components/capacity/capacity-dashboard";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  employees,
  operatorWeeklyPlan,
  serviceSchedule,
  locations,
  routes,
} from "@vendcfo/db/schema/vending";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Capacity Planning | VendCFO",
  description:
    "Employee utilization, workload distribution, and hiring recommendations.",
};

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0] ?? "";
}

export default async function CapacityPage() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  const weekStart = getCurrentWeekStart();

  let serverData = {
    employees: [] as any[],
    weeklyPlans: [] as any[],
    schedules: [] as any[],
    locations: [] as any[],
    routes: [] as any[],
  };

  try {
    const [employeeRows, weeklyPlanRows, scheduleRows, locationRows, routeRows] =
      await Promise.all([
        db
          .select({
            id: employees.id,
            name: employees.name,
            role: employees.role,
            employment_type: employees.employment_type,
            max_weekly_hours: employees.max_weekly_hours,
            hourly_rate: employees.hourly_rate,
            is_active: employees.is_active,
          })
          .from(employees)
          .where(
            and(
              eq(employees.business_id, teamId!),
              eq(employees.is_active, true),
            ),
          ),
        db
          .select({
            operator_id: operatorWeeklyPlan.operator_id,
            planned_stops: operatorWeeklyPlan.planned_stops,
            planned_driving_hrs: operatorWeeklyPlan.planned_driving_hrs,
            planned_warehouse_hrs: operatorWeeklyPlan.planned_warehouse_hrs,
            planned_load_van_hrs: operatorWeeklyPlan.planned_load_van_hrs,
            planned_stock_hrs: operatorWeeklyPlan.planned_stock_hrs,
            planned_pick_hrs: operatorWeeklyPlan.planned_pick_hrs,
          })
          .from(operatorWeeklyPlan)
          .where(
            and(
              eq(operatorWeeklyPlan.business_id, teamId!),
              eq(operatorWeeklyPlan.week_start, weekStart),
            ),
          ),
        db
          .select({
            location_id: serviceSchedule.location_id,
            day_of_week: serviceSchedule.day_of_week,
            action: serviceSchedule.action,
          })
          .from(serviceSchedule)
          .where(eq(serviceSchedule.business_id, teamId!)),
        db
          .select({
            id: locations.id,
            route_id: locations.route_id,
          })
          .from(locations)
          .where(eq(locations.business_id, teamId!)),
        db
          .select({
            id: routes.id,
            operator_id: routes.operator_id,
          })
          .from(routes)
          .where(
            and(eq(routes.business_id, teamId!), eq(routes.is_active, true)),
          ),
      ]);

    serverData = {
      employees: employeeRows,
      weeklyPlans: weeklyPlanRows,
      schedules: scheduleRows,
      locations: locationRows,
      routes: routeRows,
    };
  } catch {
    // Tables may not exist yet -- render with empty data
  }

  return <CapacityDashboard teamId={teamId!} serverData={serverData} />;
}
