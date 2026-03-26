import { OperationsDashboard } from "@/components/operations/operations-dashboard";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Operations | VendCFO",
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

  let stats = {
    routes: 0,
    locations: 0,
    machines: 0,
    products: 0,
  };

  try {
    const supabase = await createClient();

    const [routesRes, locationsRes, machinesRes, productsRes] =
      await Promise.all([
        supabase
          .from("routes")
          .select("id", { count: "exact", head: true })
          .eq("business_id", teamId)
          .eq("is_active", true),
        supabase
          .from("locations")
          .select("id", { count: "exact", head: true })
          .eq("business_id", teamId),
        supabase
          .from("machines")
          .select("id", { count: "exact", head: true })
          .eq("business_id", teamId),
        supabase
          .from("skus")
          .select("id", { count: "exact", head: true })
          .eq("business_id", teamId),
      ]);

    stats = {
      routes: routesRes.count ?? 0,
      locations: locationsRes.count ?? 0,
      machines: machinesRes.count ?? 0,
      products: productsRes.count ?? 0,
    };
  } catch {
    // Tables may not exist yet — render with zero counts
  }

  return <OperationsDashboard stats={stats} />;
}
