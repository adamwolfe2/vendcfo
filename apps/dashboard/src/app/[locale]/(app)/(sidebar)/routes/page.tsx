import { RoutesPage } from "@/components/operations/routes-page";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  routes,
  locations,
  serviceSchedule,
  operatorWeeklyPlan,
  operatorRates,
} from "@vendcfo/db/schema/vending";
import { users } from "@vendcfo/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Routes | VendCFO",
};

function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // offset to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split("T")[0] as string;
}

export default async function Page() {
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

  let routeData: any[] = [];
  let locationData: any[] = [];
  let scheduleData: any[] = [];
  let operatorPlanData: any[] = [];
  let operatorRateData: any[] = [];

  try {
    const [routeRows, locationRows, scheduleRows, planRows, rateRows] =
      await Promise.all([
        db
          .select({
            id: routes.id,
            business_id: routes.business_id,
            name: routes.name,
            description: routes.description,
            operator_id: routes.operator_id,
            is_active: routes.is_active,
            created_at: routes.created_at,
            location_count: sql<number>`(SELECT count(*) FROM locations WHERE locations.route_id = ${routes.id})`,
          })
          .from(routes)
          .where(eq(routes.business_id, teamId!))
          .orderBy(routes.name),
        db
          .select({
            id: locations.id,
            name: locations.name,
            stock_hours: locations.stock_hours,
            pick_hours: locations.pick_hours,
            route_id: locations.route_id,
          })
          .from(locations)
          .where(eq(locations.business_id, teamId!))
          .orderBy(locations.name),
        db
          .select()
          .from(serviceSchedule)
          .where(eq(serviceSchedule.business_id, teamId!)),
        db
          .select({
            id: operatorWeeklyPlan.id,
            business_id: operatorWeeklyPlan.business_id,
            operator_id: operatorWeeklyPlan.operator_id,
            week_start: operatorWeeklyPlan.week_start,
            day_of_week: operatorWeeklyPlan.day_of_week,
            planned_stops: operatorWeeklyPlan.planned_stops,
            planned_driving_hrs: operatorWeeklyPlan.planned_driving_hrs,
            planned_gas_tolls_hrs: operatorWeeklyPlan.planned_gas_tolls_hrs,
            planned_warehouse_hrs: operatorWeeklyPlan.planned_warehouse_hrs,
            planned_load_van_hrs: operatorWeeklyPlan.planned_load_van_hrs,
            planned_stock_hrs: operatorWeeklyPlan.planned_stock_hrs,
            planned_pick_hrs: operatorWeeklyPlan.planned_pick_hrs,
            actual_stops: operatorWeeklyPlan.actual_stops,
            actual_driving_hrs: operatorWeeklyPlan.actual_driving_hrs,
            actual_gas_tolls_hrs: operatorWeeklyPlan.actual_gas_tolls_hrs,
            actual_warehouse_hrs: operatorWeeklyPlan.actual_warehouse_hrs,
            actual_load_van_hrs: operatorWeeklyPlan.actual_load_van_hrs,
            actual_stock_hrs: operatorWeeklyPlan.actual_stock_hrs,
            actual_pick_hrs: operatorWeeklyPlan.actual_pick_hrs,
            created_at: operatorWeeklyPlan.created_at,
            user_full_name: users.fullName,
            user_email: users.email,
          })
          .from(operatorWeeklyPlan)
          .leftJoin(users, eq(operatorWeeklyPlan.operator_id, users.id))
          .where(
            and(
              eq(operatorWeeklyPlan.business_id, teamId!),
              eq(operatorWeeklyPlan.week_start, weekStart),
            ),
          ),
        db
          .select()
          .from(operatorRates)
          .where(eq(operatorRates.business_id, teamId!)),
      ]);

    // Shape route data to match Supabase response format
    routeData = routeRows.map((r) => ({
      ...r,
      locations: [{ count: Number(r.location_count ?? 0) }],
    }));

    locationData = locationRows;
    scheduleData = scheduleRows;

    // Shape operator plans to match Supabase response format with nested users
    operatorPlanData = planRows.map((p) => ({
      ...p,
      users: p.user_full_name
        ? { full_name: p.user_full_name, email: p.user_email }
        : null,
    }));

    operatorRateData = rateRows;
  } catch {
    // Some tables may not exist -- render with whatever we have
  }

  return (
    <RoutesPage
      initialData={routeData}
      initialLocations={locationData}
      initialSchedules={scheduleData}
      initialOperatorPlans={operatorPlanData}
      initialOperatorRates={operatorRateData}
      teamId={teamId!}
      weekStart={weekStart}
    />
  );
}
