import { db } from "@vendcfo/db/client";
import { transactions } from "@vendcfo/db/schema";
import {
  machines,
  locations,
} from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";

export interface MachinePnL {
  machineId: string;
  serialNumber: string | null;
  makeModel: string | null;
  locationName: string | null;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  transactionCount: number;
}

export async function getMachineRevenue(
  teamId: string,
  machineId: string,
  from: string,
  to: string,
): Promise<{ revenue: number; expenses: number; transactionCount: number }> {
  const [result] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
      transactionCount: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        eq(transactions.machineId, machineId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    );

  return {
    revenue: Number(result?.revenue || 0),
    expenses: Number(result?.expenses || 0),
    transactionCount: Number(result?.transactionCount || 0),
  };
}

export async function getMachineComparison(
  teamId: string,
  from: string,
  to: string,
): Promise<MachinePnL[]> {
  const results = await db
    .select({
      machineId: machines.id,
      serialNumber: machines.serial_number,
      makeModel: machines.make_model,
      locationName: locations.name,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
      transactionCount: count(transactions.id),
    })
    .from(machines)
    .leftJoin(locations, eq(machines.location_id, locations.id))
    .leftJoin(
      transactions,
      and(
        eq(transactions.machineId, machines.id),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    )
    .where(eq(machines.business_id, teamId))
    .groupBy(
      machines.id,
      machines.serial_number,
      machines.make_model,
      locations.name,
    )
    .orderBy(
      sql`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0) DESC`,
    );

  return results.map((r) => {
    const revenue = Number(r.revenue || 0);
    const expenses = Number(r.expenses || 0);
    const netProfit = revenue - expenses;
    return {
      machineId: r.machineId,
      serialNumber: r.serialNumber,
      makeModel: r.makeModel,
      locationName: r.locationName,
      revenue,
      expenses,
      netProfit,
      profitMargin: revenue > 0 ? netProfit / revenue : 0,
      transactionCount: Number(r.transactionCount || 0),
    };
  });
}

export async function getLocationPerformance(
  teamId: string,
  from: string,
  to: string,
): Promise<
  {
    locationId: string;
    locationName: string;
    machineCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }[]
> {
  const results = await db
    .select({
      locationId: locations.id,
      locationName: locations.name,
      machineCount: count(machines.id),
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
    })
    .from(locations)
    .leftJoin(machines, eq(machines.location_id, locations.id))
    .leftJoin(
      transactions,
      and(
        eq(transactions.locationId, locations.id),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    )
    .where(eq(locations.business_id, teamId))
    .groupBy(locations.id, locations.name);

  return results.map((r) => ({
    locationId: r.locationId,
    locationName: r.locationName,
    machineCount: Number(r.machineCount || 0),
    totalRevenue: Number(r.totalRevenue || 0),
    totalExpenses: Number(r.totalExpenses || 0),
    netProfit: Number(r.totalRevenue || 0) - Number(r.totalExpenses || 0),
  }));
}
