import { db } from "@vendcfo/db/client";
import {
  transactions,
  invoices,
  bankConnections,
} from "@vendcfo/db/schema";
import {
  machines,
  locations,
  routes,
} from "@vendcfo/db/schema/vending";
import { eq, and, sql, count, sum, min, max, lt } from "drizzle-orm";

/**
 * Builds a concise business context string for injection into AI agent prompts.
 * Runs all queries in parallel for speed — called on every chat message.
 */
export async function buildBusinessContext(teamId: string): Promise<string> {
  const now = new Date();

  const [
    machineResult,
    locationResult,
    routeResult,
    txnStats,
    overdueResult,
    connectionResult,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(machines)
      .where(eq(machines.business_id, teamId)),
    db
      .select({ count: count() })
      .from(locations)
      .where(eq(locations.business_id, teamId)),
    db
      .select({ count: count() })
      .from(routes)
      .where(eq(routes.business_id, teamId)),
    db
      .select({
        total: count(),
        minDate: min(transactions.date),
        maxDate: max(transactions.date),
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.teamId, teamId)),
    db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, teamId),
          eq(invoices.status, "overdue"),
        ),
      ),
    db
      .select({ count: count() })
      .from(bankConnections)
      .where(eq(bankConnections.teamId, teamId)),
  ]);

  const machines_n = machineResult[0]?.count ?? 0;
  const locations_n = locationResult[0]?.count ?? 0;
  const routes_n = routeResult[0]?.count ?? 0;
  const stats = txnStats[0];
  const revenue = Number(stats?.totalRevenue ?? 0);
  const expenses = Number(stats?.totalExpenses ?? 0);
  const margin =
    revenue > 0
      ? ((revenue - expenses) / revenue * 100).toFixed(1)
      : "N/A";
  const revenuePerMachine =
    machines_n > 0 ? (revenue / machines_n).toFixed(0) : "N/A";
  const overdue = overdueResult[0]?.count ?? 0;
  const connections = connectionResult[0]?.count ?? 0;

  // Calculate months of data
  const months =
    stats?.minDate && stats?.maxDate
      ? Math.ceil(
          (new Date(stats.maxDate).getTime() -
            new Date(stats.minDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        )
      : 0;

  return `
## Your Business Context
- ${machines_n} machines across ${locations_n} locations on ${routes_n} routes
- ${stats?.total ?? 0} transactions spanning ${months} months
- Connected bank accounts: ${connections}
- Total revenue: $${revenue.toFixed(2)} | Total expenses: $${expenses.toFixed(2)}
- Estimated gross margin: ${margin}%
- Revenue per machine: $${revenuePerMachine}
- Overdue invoices: ${overdue}
`.trim();
}
