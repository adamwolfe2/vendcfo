import { z } from "zod";
import { tool } from "ai";
import { queryFinancialData } from "./tool-financial";
import { queryOperationsData } from "./tool-operations";
import { queryInvoiceData } from "./tool-invoices";
import { queryCustomerData } from "./tool-customers";
import { queryTrackerData } from "./tool-tracker";
import { executeCalculation } from "./tool-calculators";
import { queryWorkforceData } from "./tool-workforce";
import { queryRevenueData } from "./tool-revenue";

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
