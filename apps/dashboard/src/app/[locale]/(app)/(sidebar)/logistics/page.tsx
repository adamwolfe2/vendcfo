import { RouteLogistics } from "@/components/logistics/route-logistics";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Route Logistics | VendCFO",
};

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

  let locations: any[] = [];
  let routes: any[] = [];

  try {
    const supabase = await createClient();

    const [locationsRes, routesRes] = await Promise.all([
      supabase
        .from("locations")
        .select("id, name, address, route_id, is_active")
        .eq("business_id", teamId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("routes")
        .select("id, name")
        .eq("business_id", teamId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    locations = locationsRes.data ?? [];
    routes = routesRes.data ?? [];
  } catch {
    // Tables may not exist yet — render empty
  }

  return (
    <RouteLogistics
      locations={locations}
      routes={routes}
      teamId={teamId}
    />
  );
}
