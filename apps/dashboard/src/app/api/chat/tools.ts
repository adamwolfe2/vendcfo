import { db } from "@vendcfo/db/client";
import {
  transactions,
  invoices,
  invoiceStatusEnum,
  customers,
  bankAccounts,
  trackerProjects,
  trackerEntries,
} from "@vendcfo/db/schema";
import {
  machines,
  locations,
  routes,
  skus,
} from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte, sql, count, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { tool } from "ai";

// ─── Date range helper ──────────────────────────────────────────────

function getDateRange(period?: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0]!;
  let from: string;

  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0]!;
      break;
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from = d.toISOString().split("T")[0]!;
      break;
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), q, 1).toISOString().split("T")[0]!;
      break;
    }
    case "last_quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3 - 3;
      from = new Date(now.getFullYear(), q, 1).toISOString().split("T")[0]!;
      break;
    }
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]!;
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0]!;
      break;
    case "last_6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .split("T")[0]!;
      break;
    case "last_12_months":
    default:
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        .toISOString()
        .split("T")[0]!;
      break;
  }
  return { from, to };
}

// ─── Tool execution functions ───────────────────────────────────────

async function queryFinancialData(
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
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

async function queryOperationsData(
  input: {
    entity: string;
    query_type?: string;
    sort_by?: string;
  },
  teamId: string,
): Promise<string> {
  try {
  if (input.entity === "machines") {
    const results = await db
      .select({
        id: machines.id,
        serialNumber: machines.serial_number,
        makeModel: machines.make_model,
        machineType: machines.machine_type,
        locationName: locations.name,
        purchasePrice: machines.purchase_price,
        isActive: machines.is_active,
      })
      .from(machines)
      .leftJoin(locations, eq(machines.location_id, locations.id))
      .where(eq(machines.business_id, teamId))
      .limit(50);

    return JSON.stringify({
      entity: "machines",
      count: results.length,
      machines: results,
    });
  }

  if (input.entity === "locations") {
    const results = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        locationType: locations.location_type,
        revSharePct: locations.rev_share_pct,
        monthlyRent: locations.monthly_rent,
        routeName: routes.name,
        isActive: locations.is_active,
      })
      .from(locations)
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(eq(locations.business_id, teamId))
      .limit(50);

    return JSON.stringify({
      entity: "locations",
      count: results.length,
      locations: results,
    });
  }

  if (input.entity === "routes") {
    const results = await db
      .select({
        id: routes.id,
        name: routes.name,
        description: routes.description,
        isActive: routes.is_active,
      })
      .from(routes)
      .where(eq(routes.business_id, teamId))
      .limit(50);

    return JSON.stringify({
      entity: "routes",
      count: results.length,
      routes: results,
    });
  }

  if (input.entity === "products") {
    const results = await db
      .select({
        id: skus.id,
        name: skus.name,
        category: skus.category,
        unitCost: skus.unit_cost,
        retailPrice: skus.retail_price,
        targetMarginPct: skus.target_margin_pct,
        supplier: skus.supplier,
      })
      .from(skus)
      .where(eq(skus.business_id, teamId))
      .limit(50);

    return JSON.stringify({
      entity: "products",
      count: results.length,
      products: results,
    });
  }

  return JSON.stringify({ error: "Unknown entity" });
  } catch (error) {
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

const validInvoiceStatuses = invoiceStatusEnum.enumValues;
type InvoiceStatus = (typeof validInvoiceStatuses)[number];

function isValidInvoiceStatus(value: string): value is InvoiceStatus {
  return (validInvoiceStatuses as readonly string[]).includes(value);
}

async function queryInvoiceData(
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
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

async function queryCustomerData(
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
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

async function queryTrackerData(
  input: {
    query_type?: string;
    period?: string;
  },
  teamId: string,
): Promise<string> {
  try {
  const projects = await db
    .select({
      id: trackerProjects.id,
      name: trackerProjects.name,
      rate: trackerProjects.rate,
      status: trackerProjects.status,
    })
    .from(trackerProjects)
    .where(eq(trackerProjects.teamId, teamId));

  const [hoursSummary] = await db
    .select({
      totalDuration: sql<number>`COALESCE(SUM(${trackerEntries.duration}), 0)`,
      entryCount: count(),
    })
    .from(trackerEntries)
    .where(eq(trackerEntries.teamId, teamId));

  const totalHours = Number(hoursSummary?.totalDuration || 0) / 3600;

  return JSON.stringify({
    type: "tracker",
    projects: projects,
    total_hours: Number(totalHours.toFixed(1)),
    total_entries: Number(hoursSummary?.entryCount || 0),
  });
  } catch (error) {
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

function executeCalculation(input: {
  calculator: string;
  inputs: Record<string, number>;
}): string {
  try {
  const { calculator, inputs } = input;

  if (calculator === "margin") {
    const cost = inputs.unit_cost || 0;
    const price = inputs.retail_price || 0;
    const merchantFee = (inputs.merchant_fee_pct || 0) / 100;
    const revShare = (inputs.rev_share_pct || 0) / 100;
    const merchantAmt = price * merchantFee;
    const revShareAmt = price * revShare;
    const profit = price - cost - merchantAmt - revShareAmt;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const breakEven = cost / (1 - merchantFee - revShare);
    return JSON.stringify({
      calculator: "margin",
      net_profit: Number(profit.toFixed(2)),
      gross_margin_pct: Number(margin.toFixed(1)),
      break_even_price: Number(breakEven.toFixed(2)),
      merchant_fee_amount: Number(merchantAmt.toFixed(2)),
      rev_share_amount: Number(revShareAmt.toFixed(2)),
    });
  }

  if (calculator === "markup") {
    const cost = inputs.unit_cost || 0;
    const markupPct = inputs.markup_pct || 0;
    const price = cost * (1 + markupPct / 100);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return JSON.stringify({
      calculator: "markup",
      selling_price: Number(price.toFixed(2)),
      gross_profit: Number(profit.toFixed(2)),
      effective_margin_pct: Number(margin.toFixed(1)),
      note: `${markupPct}% markup = ${margin.toFixed(1)}% margin (these are NOT the same number)`,
    });
  }

  if (calculator === "equipment_roi") {
    const machinePrice = inputs.machine_price || 0;
    const down = inputs.down_payment || 0;
    const apr = (inputs.apr || 8.5) / 100;
    const term = inputs.term_months || 36;
    const rev = inputs.target_revenue || 0;
    const cogs = inputs.est_cogs || 0;
    const loan = machinePrice - down;
    const monthlyRate = apr / 12;
    const payment =
      loan > 0
        ? (loan *
            (monthlyRate * Math.pow(1 + monthlyRate, term))) /
          (Math.pow(1 + monthlyRate, term) - 1)
        : 0;
    const grossProfit = rev - cogs;
    const netCashImpact = grossProfit - payment;
    const payback = grossProfit > 0 ? machinePrice / grossProfit : Infinity;
    return JSON.stringify({
      calculator: "equipment_roi",
      monthly_payment: Number(payment.toFixed(2)),
      net_cash_impact: Number(netCashImpact.toFixed(2)),
      payback_months: Number(payback.toFixed(1)),
      loan_amount: loan,
    });
  }

  if (calculator === "cash_flow") {
    const revenue = inputs.monthly_revenue || 0;
    const cogs = inputs.monthly_cogs || 0;
    const fixedCosts = inputs.monthly_fixed_costs || 0;
    const loanPayments = inputs.monthly_loan_payments || 0;
    const cashOnHand = inputs.cash_on_hand || 0;
    const netCashFlow = revenue - cogs - fixedCosts - loanPayments;
    const annualized = netCashFlow * 12;
    const runway =
      netCashFlow >= 0
        ? Infinity
        : cashOnHand / Math.abs(netCashFlow);
    return JSON.stringify({
      calculator: "cash_flow",
      net_cash_flow_monthly: Number(netCashFlow.toFixed(2)),
      annualized: Number(annualized.toFixed(2)),
      runway_months: runway === Infinity ? "infinite" : Number(runway.toFixed(1)),
    });
  }

  if (calculator === "route_profitability") {
    const stops = inputs.stops_per_route || 0;
    const avgRevPerStop = inputs.avg_revenue_per_stop || 0;
    const avgCogsPerStop = inputs.avg_cogs_per_stop || 0;
    const revSharePct = (inputs.rev_share_pct || 0) / 100;
    const driverCost = inputs.driver_cost || 0;
    const vehicleCost = inputs.vehicle_cost || 0;
    const grossRevenue = stops * avgRevPerStop;
    const totalCogs = stops * avgCogsPerStop;
    const revShareAmt = grossRevenue * revSharePct;
    const netProfit = grossRevenue - totalCogs - revShareAmt - driverCost - vehicleCost;
    const profitPerStop = stops > 0 ? netProfit / stops : 0;
    return JSON.stringify({
      calculator: "route_profitability",
      gross_revenue: Number(grossRevenue.toFixed(2)),
      net_profit: Number(netProfit.toFixed(2)),
      profit_per_stop: Number(profitPerStop.toFixed(2)),
      rev_share_amount: Number(revShareAmt.toFixed(2)),
    });
  }

  if (calculator === "labor_cost") {
    const hourlyWage = inputs.hourly_wage || 0;
    const hoursPerWeek = inputs.hours_per_week || 0;
    const overheadPct = (inputs.benefits_overhead_pct || 25) / 100;
    const routesServiced = inputs.routes_serviced || 1;
    const stopsPerRoute = inputs.stops_per_route || 1;
    const weeklyCost = hourlyWage * hoursPerWeek * (1 + overheadPct);
    const monthlyCost = weeklyCost * 4.33;
    const costPerRoute = monthlyCost / routesServiced;
    const costPerStop = costPerRoute / stopsPerRoute;
    return JSON.stringify({
      calculator: "labor_cost",
      weekly_cost: Number(weeklyCost.toFixed(2)),
      monthly_cost: Number(monthlyCost.toFixed(2)),
      cost_per_route: Number(costPerRoute.toFixed(2)),
      cost_per_stop: Number(costPerStop.toFixed(2)),
    });
  }

  if (calculator === "break_even") {
    const fixedCosts = inputs.global_fixed_costs || 0;
    const marginPct = (inputs.avg_margin_pct || 0) / 100;
    const fixedPerLocation = inputs.fixed_cost_per_location || 0;
    const monthlyDebt = inputs.monthly_debt || 0;
    const totalFixed = fixedCosts + monthlyDebt;
    const revenueRequired = marginPct > 0 ? totalFixed / marginPct : Infinity;
    const locationsRequired =
      fixedPerLocation > 0 && marginPct > 0
        ? Math.ceil(totalFixed / (fixedPerLocation * marginPct))
        : 0;
    return JSON.stringify({
      calculator: "break_even",
      revenue_required_monthly: revenueRequired === Infinity ? "infinite" : Number(revenueRequired.toFixed(2)),
      locations_required: locationsRequired,
    });
  }

  if (calculator === "revenue_share") {
    const monthlySales = inputs.monthly_sales || 0;
    const commissionPct = (inputs.commission_pct || 0) / 100;
    const payout = monthlySales * commissionPct;
    const netRetained = monthlySales - payout;
    const grossProfit = monthlySales * 0.52; // assume 52% gross margin
    const marginRisk = grossProfit > 0 ? (payout / grossProfit) * 100 : 0;
    return JSON.stringify({
      calculator: "revenue_share",
      total_payout: Number(payout.toFixed(2)),
      net_retained: Number(netRetained.toFixed(2)),
      margin_risk_pct: Number(marginRisk.toFixed(1)),
      note:
        marginRisk > 40
          ? "WARNING: Location is consuming over 40% of gross profit"
          : marginRisk > 25
            ? "Moderate: Location takes a significant share of gross profit"
            : "Healthy: Revenue share is manageable",
    });
  }

  return JSON.stringify({
    error: "Calculator not implemented yet",
    available: [
      "margin",
      "markup",
      "equipment_roi",
      "cash_flow",
      "route_profitability",
      "labor_cost",
      "break_even",
      "revenue_share",
    ],
  });
  } catch (error) {
    return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

// ─── Tool definitions using Vercel AI SDK ───────────────────────────

export function createChatTools(teamId: string) {
  return {
    query_financial_data: tool({
      description:
        "Query financial transactions data. Returns revenue, expenses, profit, margins, burn rate, or spending breakdowns for any date range.",
      inputSchema: z.object({
        query_type: z
          .enum([
            "revenue",
            "expenses",
            "profit_loss",
            "burn_rate",
            "spending_breakdown",
            "cash_flow",
            "growth_rate",
          ])
          .describe("Type of financial analysis"),
        period: z
          .enum([
            "this_month",
            "last_month",
            "this_quarter",
            "last_quarter",
            "this_year",
            "last_year",
            "last_6_months",
            "last_12_months",
          ])
          .optional()
          .describe("Time period"),
        group_by: z
          .enum(["month", "week", "category", "none"])
          .optional()
          .describe("How to group results"),
      }),
      execute: async ({ query_type, period, group_by }) => {
        return queryFinancialData({ query_type, period, group_by }, teamId);
      },
    }),

    query_operations_data: tool({
      description:
        "Query machines, locations, routes, and products/SKUs. Returns performance data, counts, and details.",
      inputSchema: z.object({
        entity: z
          .enum(["machines", "locations", "routes", "products"])
          .describe("What to query"),
        query_type: z
          .enum(["list", "count", "performance", "comparison"])
          .optional()
          .describe("Type of query"),
        sort_by: z
          .enum(["revenue", "name", "created", "status"])
          .optional()
          .describe("Sort order"),
      }),
      execute: async ({ entity, query_type, sort_by }) => {
        return queryOperationsData({ entity, query_type, sort_by }, teamId);
      },
    }),

    query_invoices: tool({
      description:
        "Query invoice data. Returns invoice counts, totals, overdue amounts, payment status.",
      inputSchema: z.object({
        status: z
          .enum(["all", "paid", "unpaid", "overdue", "draft", "canceled", "scheduled"])
          .optional()
          .describe("Filter by status"),
        period: z
          .enum(["this_month", "last_month", "this_quarter", "this_year", "all"])
          .optional()
          .describe("Time period"),
      }),
      execute: async ({ status, period }) => {
        return queryInvoiceData({ status, period }, teamId);
      },
    }),

    query_customers: tool({
      description:
        "Query customer data. Returns customer list, top customers by revenue, customer counts.",
      inputSchema: z.object({
        query_type: z
          .enum(["list", "top_by_revenue", "count", "details"])
          .optional()
          .describe("Type of query"),
        limit: z.number().optional().describe("Max results to return"),
      }),
      execute: async ({ query_type, limit }) => {
        return queryCustomerData({ query_type, limit }, teamId);
      },
    }),

    query_tracker: tool({
      description:
        "Query time tracking data. Returns hours worked, project time, labor costs.",
      inputSchema: z.object({
        query_type: z
          .enum(["total_hours", "by_project", "by_date", "recent_entries"])
          .optional()
          .describe("Type of query"),
        period: z
          .enum(["this_week", "last_week", "this_month", "last_month"])
          .optional()
          .describe("Time period"),
      }),
      execute: async ({ query_type, period }) => {
        return queryTrackerData({ query_type, period }, teamId);
      },
    }),

    calculate: tool({
      description:
        "Perform a financial calculation using exact formulas. For margin, markup, ROI, break-even, cash flow, route profitability, labor cost, or revenue share calculations.",
      inputSchema: z.object({
        calculator: z
          .enum([
            "margin",
            "markup",
            "cash_flow",
            "route_profitability",
            "labor_cost",
            "equipment_roi",
            "break_even",
            "revenue_share",
          ])
          .describe("Which calculator to use"),
        inputs: z
          .record(z.string(), z.number())
          .describe("Calculator-specific inputs as key-value pairs"),
      }),
      execute: async ({ calculator, inputs }) => {
        return executeCalculation({ calculator, inputs });
      },
    }),
  };
}
