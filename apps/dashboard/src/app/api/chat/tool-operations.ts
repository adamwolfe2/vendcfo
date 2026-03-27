import { db } from "@vendcfo/db/client";
import {
  machines,
  locations,
  routes,
  skus,
  serviceSchedule,
} from "@vendcfo/db/schema/vending";
import { eq, and, count, asc } from "drizzle-orm";
import { handleToolError } from "./tool-helpers";

export async function queryOperationsData(
  input: {
    entity: string;
    query_type?: string;
    sort_by?: string;
    routeId?: string;
    locationId?: string;
    dayOfWeek?: number;
  },
  teamId: string,
): Promise<string> {
  try {
  if (input.entity === "machines") {
    const conditions: ReturnType<typeof eq>[] = [eq(machines.business_id, teamId)];
    if (input.locationId) {
      conditions.push(eq(machines.location_id, input.locationId));
    }

    const results = await db
      .select({
        id: machines.id,
        serialNumber: machines.serial_number,
        makeModel: machines.make_model,
        machineType: machines.machine_type,
        locationName: locations.name,
        locationId: machines.location_id,
        capacitySlots: machines.capacity_slots,
        purchasePrice: machines.purchase_price,
        dateAcquired: machines.date_acquired,
        isActive: machines.is_active,
      })
      .from(machines)
      .leftJoin(locations, eq(machines.location_id, locations.id))
      .where(and(...conditions))
      .limit(50);

    return JSON.stringify({
      entity: "machines",
      count: results.length,
      machines: results,
    });
  }

  if (input.entity === "locations") {
    const conditions: ReturnType<typeof eq>[] = [eq(locations.business_id, teamId)];
    if (input.routeId) {
      conditions.push(eq(locations.route_id, input.routeId));
    }

    const results = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        locationType: locations.location_type,
        revSharePct: locations.rev_share_pct,
        monthlyRent: locations.monthly_rent,
        routeId: locations.route_id,
        routeName: routes.name,
        contactName: locations.contact_name,
        serviceFrequencyDays: locations.service_frequency_days,
        machineCount: locations.machine_count,
        isActive: locations.is_active,
      })
      .from(locations)
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(and(...conditions))
      .limit(50);

    return JSON.stringify({
      entity: "locations",
      count: results.length,
      locations: results,
    });
  }

  if (input.entity === "routes") {
    const results = await db
      .select({
        id: routes.id,
        name: routes.name,
        description: routes.description,
        isActive: routes.is_active,
      })
      .from(routes)
      .where(eq(routes.business_id, teamId))
      .limit(50);

    // For each route, get location count
    const routeLocationCounts = await db
      .select({
        routeId: locations.route_id,
        locationCount: count(),
      })
      .from(locations)
      .where(and(eq(locations.business_id, teamId), eq(locations.is_active, true)))
      .groupBy(locations.route_id);

    const countMap = new Map(
      routeLocationCounts.map((r) => [r.routeId, Number(r.locationCount)]),
    );

    return JSON.stringify({
      entity: "routes",
      count: results.length,
      routes: results.map((r) => ({
        ...r,
        locationCount: countMap.get(r.id) || 0,
      })),
    });
  }

  if (input.entity === "products") {
    const results = await db
      .select({
        id: skus.id,
        name: skus.name,
        category: skus.category,
        unitCost: skus.unit_cost,
        retailPrice: skus.retail_price,
        targetMarginPct: skus.target_margin_pct,
        supplier: skus.supplier,
      })
      .from(skus)
      .where(eq(skus.business_id, teamId))
      .limit(50);

    return JSON.stringify({
      entity: "products",
      count: results.length,
      products: results,
    });
  }

  if (input.entity === "schedule") {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const conditions: ReturnType<typeof eq>[] = [eq(serviceSchedule.business_id, teamId)];
    if (input.dayOfWeek !== undefined) {
      conditions.push(eq(serviceSchedule.day_of_week, input.dayOfWeek));
    }
    if (input.locationId) {
      conditions.push(eq(serviceSchedule.location_id, input.locationId));
    }

    const results = await db
      .select({
        id: serviceSchedule.id,
        locationId: serviceSchedule.location_id,
        locationName: locations.name,
        locationAddress: locations.address,
        routeName: routes.name,
        dayOfWeek: serviceSchedule.day_of_week,
        action: serviceSchedule.action,
      })
      .from(serviceSchedule)
      .innerJoin(locations, eq(serviceSchedule.location_id, locations.id))
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(and(...conditions))
      .orderBy(asc(serviceSchedule.day_of_week), asc(locations.name))
      .limit(100);

    const grouped = results.reduce<Record<string, typeof results>>(
      (acc, row) => {
        const dayName = dayNames[row.dayOfWeek] || `Day ${row.dayOfWeek}`;
        const existing = acc[dayName] || [];
        return { ...acc, [dayName]: [...existing, row] };
      },
      {},
    );

    return JSON.stringify({
      entity: "schedule",
      total_entries: results.length,
      by_day: Object.entries(grouped).map(([day, entries]) => ({
        day,
        stop_count: entries.length,
        stops: entries.map((e) => ({
          location: e.locationName,
          address: e.locationAddress,
          route: e.routeName,
          action: e.action,
        })),
      })),
    });
  }

  return JSON.stringify({ error: "Unknown entity" });
  } catch (error) {
    return handleToolError(error);
  }
}
