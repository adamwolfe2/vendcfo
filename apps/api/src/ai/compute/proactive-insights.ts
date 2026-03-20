import { db } from "@vendcfo/db/client";
import { transactions, invoices } from "@vendcfo/db/schema";
import { eq, and, sql, count } from "drizzle-orm";

export interface ProactiveInsight {
  type:
    | "anomaly"
    | "benchmark_violation"
    | "data_quality"
    | "goal_progress"
    | "trend_change";
  severity: "info" | "warning" | "positive";
  message: string;
}

export async function checkProactiveInsights(
  teamId: string,
  primaryToolName: string,
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthEnd = `${lastMonthEndDate.getFullYear()}-${String(lastMonthEndDate.getMonth() + 1).padStart(2, "0")}-${String(lastMonthEndDate.getDate()).padStart(2, "0")}`;

  try {
    // 1. Check MoM expense change (only if not already the primary topic)
    if (
      !["getExpenses", "getSpending", "getBurnRate"].includes(primaryToolName)
    ) {
      const [thisMonthExp] = await db
        .select({
          total: sql<number>`COALESCE(SUM(ABS(base_amount)), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            sql`base_amount < 0`,
            sql`${transactions.date} >= ${thisMonthStart}`,
          ),
        );

      const [lastMonthExp] = await db
        .select({
          total: sql<number>`COALESCE(SUM(ABS(base_amount)), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            sql`base_amount < 0`,
            sql`${transactions.date} >= ${lastMonthStart}`,
            sql`${transactions.date} <= ${lastMonthEnd}`,
          ),
        );

      const thisTotal = Number(thisMonthExp?.total || 0);
      const lastTotal = Number(lastMonthExp?.total || 0);

      if (lastTotal > 0) {
        const changePct = ((thisTotal - lastTotal) / lastTotal) * 100;
        if (Math.abs(changePct) > 15) {
          insights.push({
            type: "trend_change",
            severity: changePct > 0 ? "warning" : "positive",
            message:
              changePct > 0
                ? `Also worth noting: expenses are up ${changePct.toFixed(0)}% vs last month.`
                : `Good news: expenses dropped ${Math.abs(changePct).toFixed(0)}% vs last month.`,
          });
        }
      }
    }

    // 2. Check for uncategorized transactions (data quality)
    if (!["getSmartAlerts"].includes(primaryToolName)) {
      const [uncategorizedResult] = await db
        .select({ count: count() })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            sql`${transactions.categorySlug} IS NULL`,
          ),
        );

      const uncategorizedCount = Number(uncategorizedResult?.count || 0);
      if (uncategorizedCount > 10) {
        insights.push({
          type: "data_quality",
          severity: "info",
          message: `You have ${uncategorizedCount} transactions with no category -- reviewing them will improve report accuracy.`,
        });
      }
    }

    // 3. Overdue invoices (only if not already shown)
    if (
      !["getInvoices", "getInvoicePaymentAnalysis"].includes(primaryToolName)
    ) {
      const [overdueResult] = await db
        .select({ count: count() })
        .from(invoices)
        .where(
          and(eq(invoices.teamId, teamId), eq(invoices.status, "overdue")),
        );

      const overdueCount = Number(overdueResult?.count || 0);
      if (overdueCount > 0) {
        insights.push({
          type: "anomaly",
          severity: "warning",
          message: `Quick heads up: ${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""} need follow-up.`,
        });
      }
    }
  } catch {
    // Don't fail the response if proactive checks error
  }

  // Cap at 2, sort by severity
  const severityWeight: Record<string, number> = {
    warning: 3,
    positive: 2,
    info: 1,
  };
  return insights
    .sort(
      (a, b) =>
        (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0),
    )
    .slice(0, 2);
}
