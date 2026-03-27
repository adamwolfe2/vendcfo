import { db } from "@vendcfo/db/client";
import { locations, revenueRecords } from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte, sql, count, desc, asc } from "drizzle-orm";
import { getDateRange } from "./tool-helpers";

export async function queryRevenueData(
  input: {
    query_type: string;
    period?: string;
    locationId?: string;
    limit?: number;
  },
  teamId: string,
): Promise<string> {
  try {
    const { from, to } = getDateRange(input.period);

    if (input.query_type === "summary") {
      const conditions: ReturnType<typeof eq>[] = [
        eq(revenueRecords.business_id, teamId),
        gte(revenueRecords.period_start, from),
        lte(revenueRecords.period_end, to),
      ];
      if (input.locationId) {
        conditions.push(eq(revenueRecords.location_id, input.locationId));
      }

      const [result] = await db
        .select({
          grossRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.gross_revenue} AS numeric)), 0)`,
          processingFees: sql<number>`COALESCE(SUM(CAST(${revenueRecords.processing_fees} AS numeric)), 0)`,
          netDeposited: sql<number>`COALESCE(SUM(CAST(${revenueRecords.net_deposited} AS numeric)), 0)`,
          cashRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.cash_revenue} AS numeric)), 0)`,
          cardRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.card_revenue} AS numeric)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${revenueRecords.transaction_count}), 0)`,
          recordCount: count(),
        })
        .from(revenueRecords)
        .where(and(...conditions));

      const gross = Number(result?.grossRevenue || 0);
      const fees = Number(result?.processingFees || 0);
      const feePct = gross > 0 ? ((fees / gross) * 100).toFixed(2) : "0";

      return JSON.stringify({
        type: "revenue_summary",
        period: { from, to },
        gross_revenue: gross,
        processing_fees: fees,
        processing_fee_pct: Number(feePct),
        net_deposited: Number(result?.netDeposited || 0),
        cash_revenue: Number(result?.cashRevenue || 0),
        card_revenue: Number(result?.cardRevenue || 0),
        total_transactions: Number(result?.totalTransactions || 0),
        record_count: Number(result?.recordCount || 0),
      });
    }

    if (input.query_type === "by_location") {
      const results = await db
        .select({
          locationId: revenueRecords.location_id,
          locationName: locations.name,
          locationType: locations.location_type,
          revSharePct: locations.rev_share_pct,
          grossRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.gross_revenue} AS numeric)), 0)`,
          processingFees: sql<number>`COALESCE(SUM(CAST(${revenueRecords.processing_fees} AS numeric)), 0)`,
          netDeposited: sql<number>`COALESCE(SUM(CAST(${revenueRecords.net_deposited} AS numeric)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${revenueRecords.transaction_count}), 0)`,
        })
        .from(revenueRecords)
        .innerJoin(locations, eq(revenueRecords.location_id, locations.id))
        .where(
          and(
            eq(revenueRecords.business_id, teamId),
            gte(revenueRecords.period_start, from),
            lte(revenueRecords.period_end, to),
          ),
        )
        .groupBy(
          revenueRecords.location_id,
          locations.name,
          locations.location_type,
          locations.rev_share_pct,
        )
        .orderBy(desc(sql`SUM(CAST(${revenueRecords.gross_revenue} AS numeric))`))
        .limit(input.limit || 50);

      return JSON.stringify({
        type: "revenue_by_location",
        period: { from, to },
        count: results.length,
        locations: results.map((r) => {
          const gross = Number(r.grossRevenue);
          const fees = Number(r.processingFees);
          const revShare = Number(r.revSharePct || 0);
          const revShareAmt = gross * (revShare / 100);
          const netAfterAll = gross - fees - revShareAmt;
          return {
            location_id: r.locationId,
            location_name: r.locationName,
            location_type: r.locationType,
            gross_revenue: gross,
            processing_fees: fees,
            net_deposited: Number(r.netDeposited),
            rev_share_pct: revShare,
            rev_share_amount: Number(revShareAmt.toFixed(2)),
            net_after_rev_share: Number(netAfterAll.toFixed(2)),
            total_transactions: Number(r.totalTransactions),
          };
        }),
      });
    }

    if (input.query_type === "period_comparison") {
      // Current period
      const [current] = await db
        .select({
          grossRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.gross_revenue} AS numeric)), 0)`,
          processingFees: sql<number>`COALESCE(SUM(CAST(${revenueRecords.processing_fees} AS numeric)), 0)`,
          netDeposited: sql<number>`COALESCE(SUM(CAST(${revenueRecords.net_deposited} AS numeric)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${revenueRecords.transaction_count}), 0)`,
        })
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId),
            gte(revenueRecords.period_start, from),
            lte(revenueRecords.period_end, to),
          ),
        );

      // Previous period (same duration, shifted back)
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const durationMs = toDate.getTime() - fromDate.getTime();
      const prevTo = new Date(fromDate.getTime() - 1).toISOString().split("T")[0]!;
      const prevFrom = new Date(fromDate.getTime() - durationMs).toISOString().split("T")[0]!;

      const [previous] = await db
        .select({
          grossRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.gross_revenue} AS numeric)), 0)`,
          processingFees: sql<number>`COALESCE(SUM(CAST(${revenueRecords.processing_fees} AS numeric)), 0)`,
          netDeposited: sql<number>`COALESCE(SUM(CAST(${revenueRecords.net_deposited} AS numeric)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${revenueRecords.transaction_count}), 0)`,
        })
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId),
            gte(revenueRecords.period_start, prevFrom),
            lte(revenueRecords.period_end, prevTo),
          ),
        );

      const currentGross = Number(current?.grossRevenue || 0);
      const previousGross = Number(previous?.grossRevenue || 0);
      const growthPct =
        previousGross > 0
          ? (((currentGross - previousGross) / previousGross) * 100).toFixed(1)
          : "N/A";

      return JSON.stringify({
        type: "period_comparison",
        current_period: {
          from,
          to,
          gross_revenue: currentGross,
          processing_fees: Number(current?.processingFees || 0),
          net_deposited: Number(current?.netDeposited || 0),
          total_transactions: Number(current?.totalTransactions || 0),
        },
        previous_period: {
          from: prevFrom,
          to: prevTo,
          gross_revenue: previousGross,
          processing_fees: Number(previous?.processingFees || 0),
          net_deposited: Number(previous?.netDeposited || 0),
          total_transactions: Number(previous?.totalTransactions || 0),
        },
        growth_pct: growthPct === "N/A" ? growthPct : Number(growthPct),
      });
    }

    if (input.query_type === "monthly_trend") {
      const results = await db
        .select({
          month: sql<string>`to_char(${revenueRecords.period_start}::date, 'YYYY-MM')`,
          grossRevenue: sql<number>`COALESCE(SUM(CAST(${revenueRecords.gross_revenue} AS numeric)), 0)`,
          processingFees: sql<number>`COALESCE(SUM(CAST(${revenueRecords.processing_fees} AS numeric)), 0)`,
          netDeposited: sql<number>`COALESCE(SUM(CAST(${revenueRecords.net_deposited} AS numeric)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${revenueRecords.transaction_count}), 0)`,
        })
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.business_id, teamId),
            gte(revenueRecords.period_start, from),
            lte(revenueRecords.period_end, to),
          ),
        )
        .groupBy(sql`to_char(${revenueRecords.period_start}::date, 'YYYY-MM')`)
        .orderBy(asc(sql`to_char(${revenueRecords.period_start}::date, 'YYYY-MM')`));

      return JSON.stringify({
        type: "monthly_trend",
        period: { from, to },
        months: results.map((r) => ({
          month: r.month,
          gross_revenue: Number(r.grossRevenue),
          processing_fees: Number(r.processingFees),
          net_deposited: Number(r.netDeposited),
          total_transactions: Number(r.totalTransactions),
        })),
      });
    }

    return JSON.stringify({
      error: "Unknown query type",
      available: [
        "summary",
        "by_location",
        "period_comparison",
        "monthly_trend",
      ],
    });
  } catch (error) {
    return `Unable to retrieve revenue data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}
