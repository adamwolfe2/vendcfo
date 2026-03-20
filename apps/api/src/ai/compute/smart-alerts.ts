import { db } from "@vendcfo/db/client";
import { transactions, invoices } from "@vendcfo/db/schema";
import { eq, and, count, lt, sql } from "drizzle-orm";

export interface SmartAlert {
  type: string;
  severity: "critical" | "warning" | "info";
  entity: string;
  message: string;
  metric?: Record<string, unknown>;
}

export async function computeSmartAlerts(
  teamId: string,
): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = [];

  // Run all queries in parallel
  const [overdueResult, uncategorizedResult] = await Promise.all([
    // 1. Overdue invoices
    db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, teamId),
          eq(invoices.status, "overdue"),
        ),
      ),
    // 2. Uncategorized transactions (no category slug assigned)
    db
      .select({ count: count() })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          sql`${transactions.categorySlug} IS NULL`,
        ),
      ),
  ]);

  // Overdue invoices alert
  const overdueCount = overdueResult[0]?.count ?? 0;
  if (overdueCount > 0) {
    alerts.push({
      type: "overdue_invoices",
      severity: overdueCount >= 5 ? "critical" : "warning",
      entity: "Invoices",
      message: `${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""} need attention`,
      metric: { count: overdueCount },
    });
  }

  // Uncategorized transactions alert
  const uncategorizedCount = uncategorizedResult[0]?.count ?? 0;
  if (uncategorizedCount > 0) {
    alerts.push({
      type: "uncategorized_transactions",
      severity: uncategorizedCount >= 50 ? "warning" : "info",
      entity: "Transactions",
      message: `${uncategorizedCount} transaction${uncategorizedCount > 1 ? "s" : ""} need category review`,
      metric: { count: uncategorizedCount },
    });
  }

  return alerts;
}
