import { RouteLogistics } from "@/components/logistics/route-logistics";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import { locations, routes } from "@vendcfo/db/schema/vending";
import { eq, and } from "drizzle-orm";
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

  let locationData: any[] = [];
  let routeData: any[] = [];

  try {
    const [locationRows, routeRows] = await Promise.all([
      db
        .select({
          id: locations.id,
          name: locations.name,
          address: locations.address,
          route_id: locations.route_id,
          is_active: locations.is_active,
        })
        .from(locations)
        .where(
          and(
            eq(locations.business_id, teamId!),
            eq(locations.is_active, true),
          ),
        )
        .orderBy(locations.name),
      db
        .select({
          id: routes.id,
          name: routes.name,
        })
        .from(routes)
        .where(
          and(eq(routes.business_id, teamId!), eq(routes.is_active, true)),
        )
        .orderBy(routes.name),
    ]);

    locationData = locationRows;
    routeData = routeRows;
  } catch {
    // Tables may not exist yet -- render empty
  }

  return (
    <RouteLogistics
      locations={locationData}
      routes={routeData}
      teamId={teamId!}
    />
  );
}
