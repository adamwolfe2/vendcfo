import { db } from "@vendcfo/db/client";
import { transactions } from "@vendcfo/db/schema";
import { eq, and, gte, lte, sql, count, desc, asc } from "drizzle-orm";
import { getDateRange, handleToolError } from "./tool-helpers";

export async function queryFinancialData(
  input: {
    query_type: string;
    period?: string;
    group_by?: string;
  },
  teamId: string,
): Promise<string> {
  try {
  const { from, to } = getDateRange(input.period);

  if (input.query_type === "revenue") {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
        txnCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      );

    return JSON.stringify({
      type: "revenue",
      period: { from, to },
      total_revenue: Number(result?.total || 0),
      transaction_count: Number(result?.txnCount || 0),
    });
  }

  if (input.query_type === "expenses") {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
        txnCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      );

    return JSON.stringify({
      type: "expenses",
      period: { from, to },
      total_expenses: Number(result?.total || 0),
      transaction_count: Number(result?.txnCount || 0),
    });
  }

  if (input.query_type === "profit_loss") {
    const [result] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
        txnCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      );

    const revenue = Number(result?.revenue || 0);
    const expenses = Number(result?.expenses || 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

    return JSON.stringify({
      type: "profit_loss",
      period: { from, to },
      revenue,
      expenses,
      net_profit: profit,
      profit_margin_pct: Number(margin),
    });
  }

  if (input.query_type === "spending_breakdown") {
    const results = await db
      .select({
        category: transactions.categorySlug,
        total: sql<number>`COALESCE(SUM(ABS(${transactions.baseAmount})), 0)`,
        txnCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          sql`${transactions.baseAmount} < 0`,
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      )
      .groupBy(transactions.categorySlug)
      .orderBy(desc(sql`SUM(ABS(${transactions.baseAmount}))`));

    return JSON.stringify({
      type: "spending_breakdown",
      period: { from, to },
      categories: results.map((r) => ({
        category: r.category || "uncategorized",
        total: Number(r.total),
        count: Number(r.txnCount),
      })),
    });
  }

  if (
    input.query_type === "burn_rate" ||
    input.query_type === "cash_flow"
  ) {
    const results = await db
      .select({
        month: sql<string>`to_char(${transactions.date}::date, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} < 0 THEN ABS(${transactions.baseAmount}) ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      )
      .groupBy(sql`to_char(${transactions.date}::date, 'YYYY-MM')`)
      .orderBy(asc(sql`to_char(${transactions.date}::date, 'YYYY-MM')`));

    const monthly = results.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      net: Number(r.revenue) - Number(r.expenses),
    }));

    const avgBurn =
      monthly.length > 0
        ? monthly.reduce((sum, m) => sum + m.expenses, 0) / monthly.length
        : 0;

    return JSON.stringify({
      type: input.query_type,
      period: { from, to },
      monthly_data: monthly,
      average_monthly_burn: Number(avgBurn.toFixed(2)),
    });
  }

  if (input.query_type === "growth_rate") {
    const results = await db
      .select({
        month: sql<string>`to_char(${transactions.date}::date, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.baseAmount} > 0 THEN ${transactions.baseAmount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      )
      .groupBy(sql`to_char(${transactions.date}::date, 'YYYY-MM')`)
      .orderBy(asc(sql`to_char(${transactions.date}::date, 'YYYY-MM')`));

    const monthly = results.map((r, i, arr) => {
      const revenue = Number(r.revenue);
      const prevRevenue = i > 0 ? Number(arr[i - 1]!.revenue) : 0;
      const growth =
        prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      return {
        month: r.month,
        revenue,
        growth_pct: Number(growth.toFixed(1)),
      };
    });

    return JSON.stringify({
      type: "growth_rate",
      period: { from, to },
      monthly_data: monthly,
    });
  }

  return JSON.stringify({
    error: "Unknown query type",
    available: [
      "revenue",
      "expenses",
      "profit_loss",
      "burn_rate",
      "spending_breakdown",
      "cash_flow",
      "growth_rate",
    ],
  });
  } catch (error) {
    return handleToolError(error);
  }
}
