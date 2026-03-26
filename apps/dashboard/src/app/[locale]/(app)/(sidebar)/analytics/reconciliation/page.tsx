import { ReconciliationDashboard } from "@/components/analytics/reconciliation-dashboard";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  revenueRecords,
  locations,
} from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Revenue Reconciliation | VendCFO",
  description:
    "Reconcile gross sales against bank deposits with fee breakdowns per location.",
};

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default async function ReconciliationPage() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  const currentMonth = getMonthRange(0);
  const sixMonthsAgo = getMonthRange(-5);

  let serverData = {
    currentRevenue: [] as any[],
    locations: [] as any[],
    trendRevenue: [] as any[],
  };

  try {
    const [currentRevRows, locationRows, trendRevRows] = await Promise.all([
      db
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId!),
            gte(revenueRecords.period_start, currentMonth.start),
            lte(revenueRecords.period_end, currentMonth.end),
          ),
        ),
      db
        .select({
          id: locations.id,
          name: locations.name,
        })
        .from(locations)
        .where(eq(locations.business_id, teamId!)),
      db
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId!),
            gte(revenueRecords.period_start, sixMonthsAgo.start),
          ),
        )
        .orderBy(revenueRecords.period_start),
    ]);

    serverData = {
      currentRevenue: currentRevRows,
      locations: locationRows,
      trendRevenue: trendRevRows,
    };
  } catch {
    // Tables may not exist yet -- render with empty data
  }

  return <ReconciliationDashboard teamId={teamId!} serverData={serverData} />;
}
