import { OperationsDashboard } from "@/components/operations/operations-dashboard";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  routes,
  locations,
  machines,
  skus,
} from "@vendcfo/db/schema/vending";
import { eq, and, sql } from "drizzle-orm";
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
    const [routeCount, locationCount, machineCount, skuCount] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(routes)
          .where(
            and(eq(routes.business_id, teamId!), eq(routes.is_active, true)),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(locations)
          .where(eq(locations.business_id, teamId!)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(machines)
          .where(eq(machines.business_id, teamId!)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(skus)
          .where(eq(skus.business_id, teamId!)),
      ]);

    stats = {
      routes: Number(routeCount[0]?.count ?? 0),
      locations: Number(locationCount[0]?.count ?? 0),
      machines: Number(machineCount[0]?.count ?? 0),
      products: Number(skuCount[0]?.count ?? 0),
    };
  } catch {
    // Tables may not exist yet -- render with zero counts
  }

  return <OperationsDashboard stats={stats} />;
}
