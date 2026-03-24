import { RoutesPage } from "@/components/operations/routes-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
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

  const supabase = await createClient();
  const weekStart = getCurrentWeekStart();

  const [routesRes, locationsRes, schedulesRes, operatorPlansRes, operatorRatesRes] =
    await Promise.all([
      supabase
        .from("routes")
        .select("*, locations(count)")
        .eq("business_id", teamId)
        .order("name", { ascending: true }),
      supabase
        .from("locations")
        .select("id, name, stock_hours, pick_hours, route_id")
        .eq("business_id", teamId)
        .order("name", { ascending: true }),
      supabase
        .from("service_schedule")
        .select("*")
        .eq("business_id", teamId),
      supabase
        .from("operator_weekly_plan")
        .select("*, users:operator_id(full_name, email)")
        .eq("business_id", teamId)
        .eq("week_start", weekStart),
      supabase
        .from("operator_rates")
        .select("*")
        .eq("business_id", teamId),
    ]);

  return (
    <RoutesPage
      initialData={routesRes.data || []}
      initialLocations={locationsRes.data || []}
      initialSchedules={schedulesRes.data || []}
      initialOperatorPlans={operatorPlansRes.data || []}
      initialOperatorRates={operatorRatesRes.data || []}
      teamId={teamId}
      weekStart={weekStart}
    />
  );
}
