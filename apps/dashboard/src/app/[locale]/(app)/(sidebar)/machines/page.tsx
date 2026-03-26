import { MachinesPage } from "@/components/operations/machines-page";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import { machines, locations } from "@vendcfo/db/schema/vending";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Machines | VendCFO",
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
    const machineRows = await db
      .select({
        id: machines.id,
        business_id: machines.business_id,
        location_id: machines.location_id,
        serial_number: machines.serial_number,
        make_model: machines.make_model,
        machine_type: machines.machine_type,
        capacity_slots: machines.capacity_slots,
        date_acquired: machines.date_acquired,
        purchase_price: machines.purchase_price,
        is_active: machines.is_active,
        created_at: machines.created_at,
        location_name: locations.name,
      })
      .from(machines)
      .leftJoin(locations, eq(machines.location_id, locations.id))
      .where(eq(machines.business_id, teamId!))
      .orderBy(machines.serial_number);

    initialData = machineRows.map((row) => ({
      ...row,
      locations: row.location_name ? { name: row.location_name } : null,
    }));
  } catch {
    // Table may not exist yet -- render empty
  }

  return <MachinesPage initialData={initialData} teamId={teamId!} />;
}
