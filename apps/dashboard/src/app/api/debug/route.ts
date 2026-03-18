import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Require authenticated session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, any> = {};

  checks.auth = {
    authenticated: true,
    userId: user.id,
    email: user.email,
  };

  // Check database connection (no sensitive details)
  try {
    const { db } = await import("@vendcfo/db/client");
    await (db as any).$primary.execute({
      sql: "SELECT 1",
      params: [],
    });
    checks.db = { connected: true };
  } catch {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_PRIMARY_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      await pool.query("SELECT 1");
      checks.db = { connected: true };
      await pool.end();
    } catch {
      checks.db = { connected: false };
    }
  }

  // Check if user record exists
  if (user.id) {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_PRIMARY_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const res = await pool.query(
        "SELECT id, team_id FROM public.users WHERE id = $1",
        [user.id],
      );
      checks.userRecord = res.rows[0]
        ? { exists: true, hasTeam: !!res.rows[0].team_id }
        : { exists: false };
      await pool.end();
    } catch {
      checks.userRecord = { error: "Could not check" };
    }
  }

  return NextResponse.json(checks, { status: 200 });
}
