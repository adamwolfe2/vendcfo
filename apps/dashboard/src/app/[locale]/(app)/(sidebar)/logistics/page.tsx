import { RouteLogistics } from "@/components/logistics/route-logistics";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Route Logistics | VendCFO",
};

export default async function Page() {
  const caller = await getServerCaller();
  const user = await caller.user.me();

  if (!user?.teamId) {
    redirect("/teams");
  }

  const supabase = await createClient();

  // Fetch locations with route info
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, route_id, is_active")
    .eq("business_id", user.teamId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Fetch routes
  const { data: routes } = await supabase
    .from("routes")
    .select("id, name")
    .eq("business_id", user.teamId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <RouteLogistics
      locations={locations ?? []}
      routes={routes ?? []}
      teamId={user.teamId}
    />
  );
}
