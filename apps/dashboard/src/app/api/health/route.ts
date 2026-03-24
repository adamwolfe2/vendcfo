import { Pool } from "pg";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};
  const url = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL;

  // Show connection target
  if (url) {
    try {
      const parsed = new URL(url);
      results.db_host = `${parsed.hostname}:${parsed.port}${parsed.pathname}`;
      results.db_user = parsed.username;
      results.has_ssl_param = url.includes("sslmode");
      results.password_length = parsed.password?.length;
    } catch {
      results.db_host = "INVALID URL";
    }
  } else {
    results.db_host = "NO DATABASE URL SET";
  }

  // Test with raw pg Pool (bypass Drizzle entirely)
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT current_database() as db, current_user as usr");
      results.raw_pg_connection = "OK";
      results.raw_pg_result = res.rows[0];
    } finally {
      client.release();
    }
  } catch (error: any) {
    results.raw_pg_connection = "FAILED";
    results.raw_pg_error = error?.message;
    results.raw_pg_code = error?.code;
    results.raw_pg_detail = error?.detail;
    results.raw_pg_routine = error?.routine;
  }

  await pool.end().catch(() => {});

  return NextResponse.json(results, {
    status: results.raw_pg_connection === "OK" ? 200 : 500,
  });
}
