import { db } from "@vendcfo/db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface Check {
  name: string;
  status: "pass" | "fail" | "warn";
  detail?: string;
  error?: string;
}

export async function GET() {
  const checks: Check[] = [];
  const teamId = "37a44499-0807-43c2-aed5-38f7909e8627";

  // 1. Database connection
  try {
    const res = await db.execute(sql`SELECT current_database() as db`);
    checks.push({ name: "DB Connection", status: "pass", detail: String(res.rows[0]?.db) });
  } catch (e: any) {
    checks.push({ name: "DB Connection", status: "fail", error: e.message });
  }

  // 2. Core tables with data
  const tablesToCheck = [
    { table: "users", col: "team_id" },
    { table: "teams", col: "id" },
    { table: "transactions", col: "team_id" },
    { table: "invoices", col: "team_id" },
    { table: "customers", col: "team_id" },
    { table: "bank_accounts", col: "team_id" },
    { table: "tracker_projects", col: "team_id" },
    { table: "transaction_categories", col: "team_id" },
    { table: "routes", col: "business_id" },
    { table: "locations", col: "business_id" },
    { table: "machines", col: "business_id" },
    { table: "skus", col: "business_id" },
    { table: "employees", col: "business_id" },
    { table: "compensation_plans", col: "business_id" },
    { table: "service_schedule", col: "business_id" },
    { table: "operator_weekly_plan", col: "business_id" },
    { table: "revenue_records", col: "business_id" },
    { table: "sales_tax_records", col: "business_id" },
    { table: "employee_payments", col: "business_id" },
    { table: "capacity_alerts", col: "business_id" },
    { table: "location_groups", col: "business_id" },
    { table: "rev_share_agreements", col: "business_id" },
    { table: "task_types", col: "business_id" },
  ];

  for (const { table, col } of tablesToCheck) {
    try {
      const res = await db.execute(
        sql.raw(`SELECT count(*)::int as cnt FROM ${table} WHERE ${col} = '${teamId}'`)
      );
      const count = (res.rows[0] as any)?.cnt ?? 0;
      checks.push({
        name: `Table: ${table}`,
        status: count > 0 ? "pass" : "warn",
        detail: `${count} rows`,
      });
    } catch (e: any) {
      checks.push({ name: `Table: ${table}`, status: "fail", error: e.message?.substring(0, 100) });
    }
  }

  // 3. SQL Functions
  const functions = [
    "global_search",
    "global_semantic_search",
    "get_assigned_users_for_project",
    "total_duration",
    "get_project_total_amount",
    "get_team_bank_accounts_balances",
    "get_bank_account_currencies",
  ];
  for (const fn of functions) {
    try {
      const res = await db.execute(
        sql.raw(`SELECT proname FROM pg_proc WHERE proname = '${fn}'`)
      );
      checks.push({
        name: `Function: ${fn}`,
        status: res.rows.length > 0 ? "pass" : "fail",
        detail: res.rows.length > 0 ? "exists" : "MISSING",
      });
    } catch (e: any) {
      checks.push({ name: `Function: ${fn}`, status: "fail", error: e.message?.substring(0, 100) });
    }
  }

  // 4. Test global_search
  try {
    const res = await db.execute(
      sql.raw(`SELECT count(*)::int as cnt FROM global_search('${teamId}', NULL, 5)`)
    );
    checks.push({ name: "global_search() works", status: "pass", detail: `${res.rows[0]?.cnt} results` });
  } catch (e: any) {
    checks.push({ name: "global_search() works", status: "fail", error: e.message?.substring(0, 150) });
  }

  // 5. RLS status
  try {
    const res = await db.execute(
      sql`SELECT count(*)::int as cnt FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true`
    );
    const rlsCount = res.rows[0]?.cnt ?? 0;
    checks.push({
      name: "RLS disabled on all tables",
      status: rlsCount === 0 ? "pass" : "warn",
      detail: `${rlsCount} tables with RLS enabled`,
    });
  } catch (e: any) {
    checks.push({ name: "RLS check", status: "fail", error: e.message?.substring(0, 100) });
  }

  // 6. Foreign key orphans
  const orphanChecks = [
    { name: "FK: transactions→bank_accounts", query: `SELECT count(*)::int as cnt FROM transactions t WHERE t.team_id = '${teamId}' AND t.bank_account_id IS NOT NULL AND t.bank_account_id NOT IN (SELECT id FROM bank_accounts)` },
    { name: "FK: invoices→customers", query: `SELECT count(*)::int as cnt FROM invoices i WHERE i.team_id = '${teamId}' AND i.customer_id IS NOT NULL AND i.customer_id NOT IN (SELECT id FROM customers)` },
    { name: "FK: machines→locations", query: `SELECT count(*)::int as cnt FROM machines m WHERE m.business_id = '${teamId}' AND m.location_id NOT IN (SELECT id FROM locations)` },
  ];
  for (const { name, query } of orphanChecks) {
    try {
      const res = await db.execute(sql.raw(query));
      const cnt = res.rows[0]?.cnt ?? 0;
      checks.push({ name, status: cnt === 0 ? "pass" : "fail", detail: `${cnt} orphans` });
    } catch (e: any) {
      checks.push({ name, status: "fail", error: e.message?.substring(0, 100) });
    }
  }

  // Summary
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;

  return NextResponse.json({
    summary: { total: checks.length, passed, failed, warnings: warned },
    checks,
  }, { status: failed > 0 ? 500 : 200 });
}
