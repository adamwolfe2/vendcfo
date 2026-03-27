import { db } from "@vendcfo/db/client";
import { invoices, invoiceStatusEnum } from "@vendcfo/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { handleToolError } from "./tool-helpers";

const validInvoiceStatuses = invoiceStatusEnum.enumValues;
type InvoiceStatus = (typeof validInvoiceStatuses)[number];

function isValidInvoiceStatus(value: string): value is InvoiceStatus {
  return (validInvoiceStatuses as readonly string[]).includes(value);
}

export async function queryInvoiceData(
  input: {
    status?: string;
    period?: string;
  },
  teamId: string,
): Promise<string> {
  try {
  const conditions: ReturnType<typeof eq>[] = [eq(invoices.teamId, teamId)];

  if (input.status && input.status !== "all") {
    if (!isValidInvoiceStatus(input.status)) {
      return JSON.stringify({
        error: "Invalid invoice status",
        available: validInvoiceStatuses,
      });
    }
    conditions.push(eq(invoices.status, input.status));
  }

  const results = await db
    .select({
      status: invoices.status,
      invoiceCount: count(),
      total: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
    })
    .from(invoices)
    .where(and(...conditions))
    .groupBy(invoices.status);

  const totalCount = results.reduce((s, r) => s + Number(r.invoiceCount), 0);
  const totalAmount = results.reduce((s, r) => s + Number(r.total), 0);

  return JSON.stringify({
    type: "invoices",
    total_count: totalCount,
    total_amount: totalAmount,
    by_status: results.map((r) => ({
      status: r.status,
      count: Number(r.invoiceCount),
      amount: Number(r.total),
    })),
  });
  } catch (error) {
    return handleToolError(error);
  }
}
