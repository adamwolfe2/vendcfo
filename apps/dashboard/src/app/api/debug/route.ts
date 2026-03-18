import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, any> = {};

  // 1. Check Supabase auth session
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    checks.auth = {
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      error: error?.message ?? null,
    };
  } catch (e: any) {
    checks.auth = { error: e.message };
  }

  // 2. Check database connection
  try {
    const { db } = await import("@vendcfo/db/client");
    const result = await (db as any).$primary.execute(
      { sql: "SELECT count(*) as cnt FROM public.users", params: [] }
    );
    checks.db = { connected: true, userCount: result };
  } catch (e: any) {
    // Try simpler approach
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_PRIMARY_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const res = await pool.query("SELECT count(*) as cnt FROM public.users");
      checks.db = { connected: true, userCount: res.rows[0]?.cnt };
      await pool.end();
    } catch (e2: any) {
      checks.db = { connected: false, error: e2.message };
    }
  }

  // 3. Check if user exists in public.users
  if (checks.auth?.userId) {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_PRIMARY_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const res = await pool.query(
        "SELECT id, email, full_name, team_id FROM public.users WHERE id = $1",
        [checks.auth.userId]
      );
      checks.userRecord = res.rows[0] ?? "NOT FOUND";
      await pool.end();
    } catch (e: any) {
      checks.userRecord = { error: e.message };
    }
  }

  // 4. Check env vars
  checks.env = {
    DATABASE_PRIMARY_URL: process.env.DATABASE_PRIMARY_URL ? "SET" : "MISSING",
    SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "MISSING",
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING",
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL ? "SET" : "MISSING",
  };

  return NextResponse.json(checks, { status: 200 });
}
