import { ProductivityDashboard } from "@/components/productivity/productivity-dashboard";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  employees,
  operatorWeeklyPlan,
} from "@vendcfo/db/schema/vending";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Operator Productivity | VendCFO",
  description:
    "Planned vs actual hours per operator, efficiency scores, and time tracking.",
};

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0] ?? "";
}

export default async function ProductivityPage() {
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
  };

  try {
    const [employeeRows, weeklyPlanRows] = await Promise.all([
      db
        .select({
          id: employees.id,
          name: employees.name,
          role: employees.role,
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
          day_of_week: operatorWeeklyPlan.day_of_week,
          planned_stops: operatorWeeklyPlan.planned_stops,
          planned_driving_hrs: operatorWeeklyPlan.planned_driving_hrs,
          planned_warehouse_hrs: operatorWeeklyPlan.planned_warehouse_hrs,
          planned_load_van_hrs: operatorWeeklyPlan.planned_load_van_hrs,
          planned_stock_hrs: operatorWeeklyPlan.planned_stock_hrs,
          planned_pick_hrs: operatorWeeklyPlan.planned_pick_hrs,
          actual_stops: operatorWeeklyPlan.actual_stops,
          actual_driving_hrs: operatorWeeklyPlan.actual_driving_hrs,
          actual_warehouse_hrs: operatorWeeklyPlan.actual_warehouse_hrs,
          actual_load_van_hrs: operatorWeeklyPlan.actual_load_van_hrs,
          actual_stock_hrs: operatorWeeklyPlan.actual_stock_hrs,
          actual_pick_hrs: operatorWeeklyPlan.actual_pick_hrs,
        })
        .from(operatorWeeklyPlan)
        .where(
          and(
            eq(operatorWeeklyPlan.business_id, teamId!),
            eq(operatorWeeklyPlan.week_start, weekStart),
          ),
        ),
    ]);

    serverData = {
      employees: employeeRows,
      weeklyPlans: weeklyPlanRows,
    };
  } catch {
    // Tables may not exist yet -- render with empty data
  }

  return <ProductivityDashboard teamId={teamId!} serverData={serverData} />;
}
