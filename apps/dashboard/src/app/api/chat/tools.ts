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
  serviceSchedule,
  employees,
  compensationPlans,
  operatorWeeklyPlan,
  operatorRates,
  capacityAlerts,
  revenueRecords,
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
    routeId?: string;
    locationId?: string;
    dayOfWeek?: number;
  },
  teamId: string,
): Promise<string> {
  try {
  if (input.entity === "machines") {
    const conditions: ReturnType<typeof eq>[] = [eq(machines.business_id, teamId)];
    if (input.locationId) {
      conditions.push(eq(machines.location_id, input.locationId));
    }

    const results = await db
      .select({
        id: machines.id,
        serialNumber: machines.serial_number,
        makeModel: machines.make_model,
        machineType: machines.machine_type,
        locationName: locations.name,
        locationId: machines.location_id,
        capacitySlots: machines.capacity_slots,
        purchasePrice: machines.purchase_price,
        dateAcquired: machines.date_acquired,
        isActive: machines.is_active,
      })
      .from(machines)
      .leftJoin(locations, eq(machines.location_id, locations.id))
      .where(and(...conditions))
      .limit(50);

    return JSON.stringify({
      entity: "machines",
      count: results.length,
      machines: results,
    });
  }

  if (input.entity === "locations") {
    const conditions: ReturnType<typeof eq>[] = [eq(locations.business_id, teamId)];
    if (input.routeId) {
      conditions.push(eq(locations.route_id, input.routeId));
    }

    const results = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        locationType: locations.location_type,
        revSharePct: locations.rev_share_pct,
        monthlyRent: locations.monthly_rent,
        routeId: locations.route_id,
        routeName: routes.name,
        contactName: locations.contact_name,
        serviceFrequencyDays: locations.service_frequency_days,
        machineCount: locations.machine_count,
        isActive: locations.is_active,
      })
      .from(locations)
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(and(...conditions))
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

    // For each route, get location count
    const routeLocationCounts = await db
      .select({
        routeId: locations.route_id,
        locationCount: count(),
      })
      .from(locations)
      .where(and(eq(locations.business_id, teamId), eq(locations.is_active, true)))
      .groupBy(locations.route_id);

    const countMap = new Map(
      routeLocationCounts.map((r) => [r.routeId, Number(r.locationCount)]),
    );

    return JSON.stringify({
      entity: "routes",
      count: results.length,
      routes: results.map((r) => ({
        ...r,
        locationCount: countMap.get(r.id) || 0,
      })),
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

  if (input.entity === "schedule") {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const conditions: ReturnType<typeof eq>[] = [eq(serviceSchedule.business_id, teamId)];
    if (input.dayOfWeek !== undefined) {
      conditions.push(eq(serviceSchedule.day_of_week, input.dayOfWeek));
    }
    if (input.locationId) {
      conditions.push(eq(serviceSchedule.location_id, input.locationId));
    }

    const results = await db
      .select({
        id: serviceSchedule.id,
        locationId: serviceSchedule.location_id,
        locationName: locations.name,
        locationAddress: locations.address,
        routeName: routes.name,
        dayOfWeek: serviceSchedule.day_of_week,
        action: serviceSchedule.action,
      })
      .from(serviceSchedule)
      .innerJoin(locations, eq(serviceSchedule.location_id, locations.id))
      .leftJoin(routes, eq(locations.route_id, routes.id))
      .where(and(...conditions))
      .orderBy(asc(serviceSchedule.day_of_week), asc(locations.name))
      .limit(100);

    const grouped = results.reduce<Record<string, typeof results>>(
      (acc, row) => {
        const dayName = dayNames[row.dayOfWeek] || `Day ${row.dayOfWeek}`;
        const existing = acc[dayName] || [];
        return { ...acc, [dayName]: [...existing, row] };
      },
      {},
    );

    return JSON.stringify({
      entity: "schedule",
      total_entries: results.length,
      by_day: Object.entries(grouped).map(([day, entries]) => ({
        day,
        stop_count: entries.length,
        stops: entries.map((e) => ({
          location: e.locationName,
          address: e.locationAddress,
          route: e.routeName,
          action: e.action,
        })),
      })),
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

async function queryWorkforceData(
  input: {
    query_type: string;
    employeeId?: string;
    period?: string;
  },
  teamId: string,
): Promise<string> {
  try {
    if (input.query_type === "employees") {
      const results = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          role: employees.role,
          employmentType: employees.employment_type,
          maxWeeklyHours: employees.max_weekly_hours,
          hourlyRate: employees.hourly_rate,
          hireDate: employees.hire_date,
          isActive: employees.is_active,
        })
        .from(employees)
        .where(eq(employees.business_id, teamId))
        .limit(50);

      return JSON.stringify({
        type: "employees",
        count: results.length,
        employees: results,
      });
    }

    if (input.query_type === "compensation_plans") {
      const conditions: ReturnType<typeof eq>[] = [
        eq(compensationPlans.business_id, teamId),
      ];
      if (input.employeeId) {
        conditions.push(eq(compensationPlans.employee_id, input.employeeId));
      }

      const results = await db
        .select({
          id: compensationPlans.id,
          employeeId: compensationPlans.employee_id,
          employeeName: employees.name,
          planName: compensationPlans.name,
          payModel: compensationPlans.pay_model,
          hourlyRate: compensationPlans.hourly_rate,
          perMachineRate: compensationPlans.per_machine_rate,
          perStopRate: compensationPlans.per_stop_rate,
          revenueSharePct: compensationPlans.revenue_share_pct,
          effectiveFrom: compensationPlans.effective_from,
          effectiveTo: compensationPlans.effective_to,
          isActive: compensationPlans.is_active,
        })
        .from(compensationPlans)
        .innerJoin(employees, eq(compensationPlans.employee_id, employees.id))
        .where(and(...conditions))
        .limit(50);

      return JSON.stringify({
        type: "compensation_plans",
        count: results.length,
        plans: results,
      });
    }

    if (input.query_type === "labor_costs") {
      const { from, to } = getDateRange(input.period);

      const results = await db
        .select({
          operatorId: operatorWeeklyPlan.operator_id,
          weekStart: operatorWeeklyPlan.week_start,
          dayOfWeek: operatorWeeklyPlan.day_of_week,
          plannedStops: operatorWeeklyPlan.planned_stops,
          plannedDrivingHrs: operatorWeeklyPlan.planned_driving_hrs,
          plannedWarehouseHrs: operatorWeeklyPlan.planned_warehouse_hrs,
          plannedStockHrs: operatorWeeklyPlan.planned_stock_hrs,
          plannedPickHrs: operatorWeeklyPlan.planned_pick_hrs,
          plannedLoadVanHrs: operatorWeeklyPlan.planned_load_van_hrs,
          actualStops: operatorWeeklyPlan.actual_stops,
          actualDrivingHrs: operatorWeeklyPlan.actual_driving_hrs,
          actualWarehouseHrs: operatorWeeklyPlan.actual_warehouse_hrs,
          actualStockHrs: operatorWeeklyPlan.actual_stock_hrs,
          actualPickHrs: operatorWeeklyPlan.actual_pick_hrs,
          actualLoadVanHrs: operatorWeeklyPlan.actual_load_van_hrs,
        })
        .from(operatorWeeklyPlan)
        .where(
          and(
            eq(operatorWeeklyPlan.business_id, teamId),
            gte(operatorWeeklyPlan.week_start, from),
            lte(operatorWeeklyPlan.week_start, to),
          ),
        )
        .orderBy(desc(operatorWeeklyPlan.week_start))
        .limit(100);

      // Compute total planned & actual hours
      let totalPlannedHrs = 0;
      let totalActualHrs = 0;
      let totalPlannedStops = 0;
      let totalActualStops = 0;

      for (const r of results) {
        totalPlannedHrs +=
          Number(r.plannedDrivingHrs || 0) +
          Number(r.plannedWarehouseHrs || 0) +
          Number(r.plannedStockHrs || 0) +
          Number(r.plannedPickHrs || 0) +
          Number(r.plannedLoadVanHrs || 0);
        totalActualHrs +=
          Number(r.actualDrivingHrs || 0) +
          Number(r.actualWarehouseHrs || 0) +
          Number(r.actualStockHrs || 0) +
          Number(r.actualPickHrs || 0) +
          Number(r.actualLoadVanHrs || 0);
        totalPlannedStops += Number(r.plannedStops || 0);
        totalActualStops += Number(r.actualStops || 0);
      }

      // Get operator rates to compute cost
      const rates = await db
        .select({
          operatorId: operatorRates.operator_id,
          hourlyRate: operatorRates.hourly_rate,
          gasRatePerHr: operatorRates.gas_rate_per_hr,
        })
        .from(operatorRates)
        .where(eq(operatorRates.business_id, teamId));

      const avgHourlyRate =
        rates.length > 0
          ? rates.reduce((s, r) => s + Number(r.hourlyRate), 0) / rates.length
          : 25;

      const estimatedLaborCost = Number((totalActualHrs > 0
        ? totalActualHrs * avgHourlyRate
        : totalPlannedHrs * avgHourlyRate
      ).toFixed(2));

      return JSON.stringify({
        type: "labor_costs",
        period: { from, to },
        total_planned_hours: Number(totalPlannedHrs.toFixed(2)),
        total_actual_hours: Number(totalActualHrs.toFixed(2)),
        total_planned_stops: totalPlannedStops,
        total_actual_stops: totalActualStops,
        avg_hourly_rate: avgHourlyRate,
        estimated_labor_cost: estimatedLaborCost,
        day_count: results.length,
      });
    }

    if (input.query_type === "capacity_alerts") {
      const results = await db
        .select({
          id: capacityAlerts.id,
          employeeId: capacityAlerts.employee_id,
          employeeName: employees.name,
          alertType: capacityAlerts.alert_type,
          message: capacityAlerts.message,
          currentUtilization: capacityAlerts.current_utilization,
          threshold: capacityAlerts.threshold,
          isDismissed: capacityAlerts.is_dismissed,
          createdAt: capacityAlerts.created_at,
        })
        .from(capacityAlerts)
        .innerJoin(employees, eq(capacityAlerts.employee_id, employees.id))
        .where(
          and(
            eq(capacityAlerts.business_id, teamId),
            eq(capacityAlerts.is_dismissed, false),
          ),
        )
        .orderBy(desc(capacityAlerts.created_at))
        .limit(20);

      return JSON.stringify({
        type: "capacity_alerts",
        count: results.length,
        alerts: results,
      });
    }

    if (input.query_type === "operator_rates") {
      const results = await db
        .select({
          id: operatorRates.id,
          operatorId: operatorRates.operator_id,
          hourlyRate: operatorRates.hourly_rate,
          gasRatePerHr: operatorRates.gas_rate_per_hr,
        })
        .from(operatorRates)
        .where(eq(operatorRates.business_id, teamId))
        .limit(50);

      return JSON.stringify({
        type: "operator_rates",
        count: results.length,
        rates: results,
      });
    }

    return JSON.stringify({
      error: "Unknown query type",
      available: [
        "employees",
        "compensation_plans",
        "labor_costs",
        "capacity_alerts",
        "operator_rates",
      ],
    });
  } catch (error) {
    return `Unable to retrieve workforce data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}

async function queryRevenueData(
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
        "Query machines, locations, routes, products/SKUs, and service schedules. Returns details, counts, and can filter by route or location. Use 'schedule' entity to find which locations need service on a given day.",
      inputSchema: z.object({
        entity: z
          .enum(["machines", "locations", "routes", "products", "schedule"])
          .describe("What to query"),
        query_type: z
          .enum(["list", "count", "performance", "comparison"])
          .optional()
          .describe("Type of query"),
        sort_by: z
          .enum(["revenue", "name", "created", "status"])
          .optional()
          .describe("Sort order"),
        routeId: z
          .string()
          .optional()
          .describe("Filter locations by route ID"),
        locationId: z
          .string()
          .optional()
          .describe("Filter machines or schedule by location ID"),
        dayOfWeek: z
          .number()
          .optional()
          .describe("Filter schedule by day (0=Monday, 1=Tuesday, ..., 5=Saturday)"),
      }),
      execute: async ({ entity, query_type, sort_by, routeId, locationId, dayOfWeek }) => {
        return queryOperationsData(
          { entity, query_type, sort_by, routeId, locationId, dayOfWeek },
          teamId,
        );
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

    query_workforce: tool({
      description:
        "Query workforce data: employees, compensation plans, labor costs, operator rates, and capacity alerts. Use 'labor_costs' to calculate total hours worked and estimated labor cost for a period.",
      inputSchema: z.object({
        query_type: z
          .enum([
            "employees",
            "compensation_plans",
            "labor_costs",
            "capacity_alerts",
            "operator_rates",
          ])
          .describe("What workforce data to query"),
        employeeId: z
          .string()
          .optional()
          .describe("Filter compensation plans by employee ID"),
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
          .describe("Time period for labor cost queries"),
      }),
      execute: async ({ query_type, employeeId, period }) => {
        return queryWorkforceData({ query_type, employeeId, period }, teamId);
      },
    }),

    query_revenue: tool({
      description:
        "Query vending revenue records with gross/fees/net decomposition. Shows revenue by location, period comparisons, monthly trends, and processing fee analysis. This is vending-specific revenue (from machine telemetry), distinct from bank transaction data.",
      inputSchema: z.object({
        query_type: z
          .enum(["summary", "by_location", "period_comparison", "monthly_trend"])
          .describe(
            "Type of revenue analysis. 'summary' for totals, 'by_location' for per-location breakdown with rev share calc, 'period_comparison' to compare current vs previous period, 'monthly_trend' for month-over-month data.",
          ),
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
        locationId: z
          .string()
          .optional()
          .describe("Filter revenue summary to a specific location"),
        limit: z
          .number()
          .optional()
          .describe("Max locations to return for by_location queries"),
      }),
      execute: async ({ query_type, period, locationId, limit }) => {
        return queryRevenueData({ query_type, period, locationId, limit }, teamId);
      },
    }),
  };
}
