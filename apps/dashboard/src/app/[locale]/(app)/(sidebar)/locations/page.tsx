import { LocationsPage } from "@/components/operations/locations-page";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  locations,
  routes,
  machines,
} from "@vendcfo/db/schema/vending";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Locations | VendCFO",
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

  let initialData: any[] = [];

  try {
    const locationRows = await db
      .select({
        id: locations.id,
        business_id: locations.business_id,
        route_id: locations.route_id,
        name: locations.name,
        address: locations.address,
        location_type: locations.location_type,
        rev_share_pct: locations.rev_share_pct,
        rev_share_threshold: locations.rev_share_threshold,
        contact_name: locations.contact_name,
        contact_email: locations.contact_email,
        monthly_rent: locations.monthly_rent,
        service_frequency_days: locations.service_frequency_days,
        stock_hours: locations.stock_hours,
        pick_hours: locations.pick_hours,
        machine_count: locations.machine_count,
        machine_type_label: locations.machine_type_label,
        software_web: locations.software_web,
        software_type: locations.software_type,
        access_hours: locations.access_hours,
        is_active: locations.is_active,
        created_at: locations.created_at,
        route_name: routes.name,
        machine_db_count: sql<number>`(SELECT count(*) FROM machines WHERE machines.location_id = ${locations.id})`,
      })
      .from(locations)
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(eq(locations.business_id, teamId!))
      .orderBy(locations.name);

    initialData = locationRows.map((row) => ({
      ...row,
      routes: row.route_name ? { name: row.route_name } : null,
      machines: [{ count: Number(row.machine_db_count ?? 0) }],
    }));
  } catch {
    // Table may not exist yet -- render empty
  }

  return <LocationsPage initialData={initialData} teamId={teamId!} />;
}
