import type { Database } from "@db/client";
import { customers, invoices, transactions } from "@db/schema";
import { revenueRecords } from "../schema/reporting";
import {
  capacityAlerts,
  locations,
  serviceSchedule,
} from "../schema/vending";
import { subDays } from "date-fns";
import { and, count, eq, gte, lt, lte, sql } from "drizzle-orm";

export type LocationRevenue = {
  locationId: string;
  locationName: string;
  revenue: number;
};

export type WeeklyDigestData = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  topLocations: LocationRevenue[];
  bottomLocations: LocationRevenue[];
  overdueInvoices: { count: number; totalAmount: number };
  upcomingServiceStops: number;
  capacityAlertCount: number;
  newCustomerCount: number;
};

function sevenDaysAgo(): string {
  return subDays(new Date(), 7).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getTransactionSummary(
  db: Database,
  teamId: string,
): Promise<{ totalRevenue: number; totalExpenses: number }> {
  const startDate = sevenDaysAgo();
  const endDate = today();

  const [result] = await db
    .select({
      revenue:
        sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`.as(
          "revenue",
        ),
      expenses:
        sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then ${transactions.amount} else 0 end), 0)`.as(
          "expenses",
        ),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    );

  return {
    totalRevenue: Number.parseFloat(result?.revenue ?? "0"),
    totalExpenses: Number.parseFloat(result?.expenses ?? "0"),
  };
}

async function getLocationsByRevenue(
  db: Database,
  teamId: string,
): Promise<LocationRevenue[]> {
  const startDate = sevenDaysAgo();
  const endDate = today();

  // Try revenue_records first (vending-specific table).
  // The reporting.ts schema has period_start/period_end date columns.
  const rows = await db
    .select({
      locationId: locations.id,
      locationName: locations.name,
      revenue:
        sql<string>`coalesce(sum(cast(${revenueRecords.gross_revenue} as numeric)), 0)`.as(
          "revenue",
        ),
    })
    .from(revenueRecords)
    .innerJoin(locations, eq(revenueRecords.location_id, locations.id))
    .where(
      and(
        eq(revenueRecords.business_id, teamId),
        gte(revenueRecords.period_start, startDate),
        lte(revenueRecords.period_end, endDate),
      ),
    )
    .groupBy(locations.id, locations.name)
    .orderBy(sql`revenue desc`);

  // If no revenue_records, fall back to transactions with locationId
  if (rows.length === 0) {
    const txRows = await db
      .select({
        locationId: locations.id,
        locationName: locations.name,
        revenue:
          sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`.as(
            "revenue",
          ),
      })
      .from(transactions)
      .innerJoin(locations, eq(transactions.locationId, locations.id))
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      )
      .groupBy(locations.id, locations.name)
      .orderBy(sql`revenue desc`);

    return txRows.map((r) => ({
      locationId: r.locationId,
      locationName: r.locationName,
      revenue: Number.parseFloat(r.revenue),
    }));
  }

  return rows.map((r) => ({
    locationId: r.locationId,
    locationName: r.locationName,
    revenue: Number.parseFloat(r.revenue),
  }));
}

async function getOverdueInvoices(
  db: Database,
  teamId: string,
): Promise<{ count: number; totalAmount: number }> {
  const now = new Date().toISOString();

  const [result] = await db
    .select({
      invoiceCount: count(invoices.id).as("invoice_count"),
      totalAmount:
        sql<string>`coalesce(sum(${invoices.amount}), 0)`.as("total_amount"),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "overdue"),
        lt(invoices.dueDate, now),
      ),
    );

  return {
    count: Number(result?.invoiceCount ?? 0),
    totalAmount: Number.parseFloat(result?.totalAmount ?? "0"),
  };
}

async function getUpcomingServiceStops(
  db: Database,
  teamId: string,
): Promise<number> {
  // Count service_schedule entries for the current week (Mon-Sat, days 0-5)
  const rows = await db
    .select({ stopCount: count(serviceSchedule.id).as("stop_count") })
    .from(serviceSchedule)
    .innerJoin(locations, eq(serviceSchedule.location_id, locations.id))
    .where(
      and(
        eq(serviceSchedule.business_id, teamId),
        eq(locations.is_active, true),
        sql`${serviceSchedule.day_of_week} >= 0 AND ${serviceSchedule.day_of_week} <= 5`,
      ),
    );

  return Number(rows[0]?.stopCount ?? 0);
}

async function getCapacityAlertCount(
  db: Database,
  teamId: string,
): Promise<number> {
  const [result] = await db
    .select({ alertCount: count(capacityAlerts.id).as("alert_count") })
    .from(capacityAlerts)
    .where(
      and(
        eq(capacityAlerts.business_id, teamId),
        sql`${capacityAlerts.dismissed_at} IS NULL`,
      ),
    );

  return Number(result?.alertCount ?? 0);
}

async function getNewCustomerCount(
  db: Database,
  teamId: string,
): Promise<number> {
  const startDate = sevenDaysAgo();

  const [result] = await db
    .select({ customerCount: count(customers.id).as("customer_count") })
    .from(customers)
    .where(
      and(
        eq(customers.teamId, teamId),
        gte(customers.createdAt, startDate),
      ),
    );

  return Number(result?.customerCount ?? 0);
}

export async function getWeeklyDigestData(
  db: Database,
  teamId: string,
): Promise<WeeklyDigestData> {
  const [
    txSummary,
    allLocations,
    overdueInvoiceData,
    upcomingServiceStops,
    capacityAlertCount,
    newCustomerCount,
  ] = await Promise.all([
    getTransactionSummary(db, teamId),
    getLocationsByRevenue(db, teamId),
    getOverdueInvoices(db, teamId),
    getUpcomingServiceStops(db, teamId),
    getCapacityAlertCount(db, teamId),
    getNewCustomerCount(db, teamId),
  ]);

  const topLocations = allLocations.slice(0, 5);
  const bottomLocations = allLocations
    .filter((l) => l.revenue >= 0)
    .slice(-3)
    .reverse();

  return {
    totalRevenue: txSummary.totalRevenue,
    totalExpenses: txSummary.totalExpenses,
    netIncome: txSummary.totalRevenue + txSummary.totalExpenses,
    topLocations,
    bottomLocations,
    overdueInvoices: overdueInvoiceData,
    upcomingServiceStops,
    capacityAlertCount,
    newCustomerCount,
  };
}
