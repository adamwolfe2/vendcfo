import { RouteRunner } from "@/components/field/route-runner";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Field View | VendCFO",
};

function getTodayDayOfWeek(): number {
  // service_schedule uses 0=Mon, 5=Sat
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...6=Sat
  if (jsDay === 0) return 6; // Sunday maps to 6 (not in schedule range, will show no stops)
  return jsDay - 1; // Mon=0, Tue=1, ... Sat=5
}

export default async function Page() {
  let teamId: string | null = null;
  let userName = "Operator";

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
    userName = user.fullName || user.email || "Operator";
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const todayDow = getTodayDayOfWeek();

  let routes: any[] = [];
  let locations: any[] = [];
  let schedules: any[] = [];
  let machines: any[] = [];

  try {
    const [routesRes, locationsRes, schedulesRes, machinesRes] =
      await Promise.all([
        supabase
          .from("routes")
          .select("id, name, description, operator_id")
          .eq("business_id", teamId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("locations")
          .select("id, name, address, route_id, stock_hours, pick_hours")
          .eq("business_id", teamId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("service_schedule")
          .select("id, location_id, day_of_week, action")
          .eq("business_id", teamId),
        supabase
          .from("machines")
          .select("id, location_id, serial_number, make_model, machine_type")
          .eq("business_id", teamId)
          .eq("is_active", true),
      ]);

    routes = routesRes.data ?? [];
    locations = locationsRes.data ?? [];
    schedules = schedulesRes.data ?? [];
    machines = machinesRes.data ?? [];
  } catch {
    // Tables may not exist yet — render empty
  }

  return (
    <RouteRunner
      routes={routes}
      locations={locations}
      schedules={schedules}
      machines={machines}
      teamId={teamId}
      userName={userName}
      todayDayOfWeek={todayDow}
    />
  );
}
