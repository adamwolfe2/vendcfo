import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  locations,
  routes,
  revenueRecords,
  operatorWeeklyPlan,
} from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Finance Dashboard | VendCFO",
  description:
    "Revenue overview, location performance, route summary, and P&L.",
};

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default async function FinancePage() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  const currentMonth = getMonthRange(0);
  const prevMonth = getMonthRange(-1);
  const sixMonthsAgo = getMonthRange(-5);

  let serverData = {
    currentRevenue: [] as any[],
    prevRevenue: [] as any[],
    locations: [] as any[],
    routes: [] as any[],
    trendRevenue: [] as any[],
    weeklyPlans: [] as any[],
  };

  try {
    const [
      currentRevRows,
      prevRevRows,
      locationRows,
      routeRows,
      trendRevRows,
      weeklyPlanRows,
    ] = await Promise.all([
      db
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId!),
            gte(revenueRecords.period_start, currentMonth.start),
            lte(revenueRecords.period_end, currentMonth.end),
          ),
        ),
      db
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId!),
            gte(revenueRecords.period_start, prevMonth.start),
            lte(revenueRecords.period_end, prevMonth.end),
          ),
        ),
      db
        .select({
          id: locations.id,
          name: locations.name,
          route_id: locations.route_id,
          monthly_rent: locations.monthly_rent,
        })
        .from(locations)
        .where(eq(locations.business_id, teamId!)),
      db
        .select({ id: routes.id, name: routes.name })
        .from(routes)
        .where(
          and(eq(routes.business_id, teamId!), eq(routes.is_active, true)),
        ),
      db
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId!),
            gte(revenueRecords.period_start, sixMonthsAgo.start),
          ),
        )
        .orderBy(revenueRecords.period_start),
      db
        .select({
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
            gte(operatorWeeklyPlan.week_start, currentMonth.start),
            lte(operatorWeeklyPlan.week_start, currentMonth.end),
          ),
        ),
    ]);

    serverData = {
      currentRevenue: currentRevRows,
      prevRevenue: prevRevRows,
      locations: locationRows,
      routes: routeRows,
      trendRevenue: trendRevRows,
      weeklyPlans: weeklyPlanRows,
    };
  } catch {
    // Tables may not exist yet -- render with empty data
  }

  return <FinanceDashboard teamId={teamId!} serverData={serverData} />;
}
