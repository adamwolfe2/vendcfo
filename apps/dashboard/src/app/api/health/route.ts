import { db } from "@vendcfo/db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check env vars (show host only)
  try {
    const url = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL;
    if (url) {
      const parsed = new URL(url);
      results.db_host = `${parsed.hostname}:${parsed.port}${parsed.pathname}`;
      results.db_user = parsed.username;
    } else {
      results.db_host = "NO DATABASE URL SET";
    }
  } catch {
    results.db_host = "INVALID URL FORMAT";
  }

  // Test raw query
  try {
    const res = await db.execute(sql`SELECT current_database() as db, current_user as usr, version() as ver`);
    results.connection = "OK";
    results.database = res.rows[0];
  } catch (error) {
    results.connection = "FAILED";
    results.error = error instanceof Error ? error.message : String(error);
    results.stack = error instanceof Error ? error.stack?.split("\n").slice(0, 3) : undefined;
  }

  // Test users query
  try {
    const res = await db.execute(
      sql`SELECT id, full_name, team_id FROM users WHERE id = 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1'`
    );
    results.user_query = "OK";
    results.user = res.rows[0];
  } catch (error) {
    results.user_query = "FAILED";
    results.user_error = error instanceof Error ? error.message : String(error);
  }

  // Test users+teams join
  try {
    const res = await db.execute(
      sql`SELECT u.id, u.full_name, t.name as team_name FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.id = 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1'`
    );
    results.join_query = "OK";
    results.join = res.rows[0];
  } catch (error) {
    results.join_query = "FAILED";
    results.join_error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results, { status: results.connection === "OK" ? 200 : 500 });
}
