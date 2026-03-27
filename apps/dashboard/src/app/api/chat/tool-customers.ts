import { db } from "@vendcfo/db/client";
import { invoices, customers } from "@vendcfo/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";
import { handleToolError } from "./tool-helpers";

export async function queryCustomerData(
  input: {
    query_type?: string;
    limit?: number;
  },
  teamId: string,
): Promise<string> {
  try {
  if (input.query_type === "top_by_revenue") {
    // Join with invoices to get revenue per customer
    const results = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        status: customers.status,
        totalRevenue: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        invoiceCount: count(invoices.id),
      })
      .from(customers)
      .leftJoin(invoices, eq(customers.id, invoices.customerId))
      .where(eq(customers.teamId, teamId))
      .groupBy(customers.id, customers.name, customers.email, customers.status)
      .orderBy(desc(sql`SUM(${invoices.amount})`))
      .limit(input.limit || 10);

    return JSON.stringify({
      type: "customers_by_revenue",
      count: results.length,
      customers: results.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        status: r.status,
        total_revenue: Number(r.totalRevenue),
        invoice_count: Number(r.invoiceCount),
      })),
    });
  }

  if (input.query_type === "count") {
    const [result] = await db
      .select({ total: count() })
      .from(customers)
      .where(eq(customers.teamId, teamId));

    return JSON.stringify({
      type: "customer_count",
      total: Number(result?.total || 0),
    });
  }

  // Default: list customers
  const results = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      status: customers.status,
      phone: customers.phone,
      website: customers.website,
    })
    .from(customers)
    .where(eq(customers.teamId, teamId))
    .limit(input.limit || 20);

  return JSON.stringify({
    type: "customers",
    count: results.length,
    customers: results,
  });
  } catch (error) {
    return handleToolError(error);
  }
}
