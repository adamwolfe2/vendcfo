import { db } from "@vendcfo/db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.execute(
      sql`SELECT current_database() as db, now() as server_time`,
    );
    return NextResponse.json({
      status: "ok",
      database: res.rows[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 },
    );
  }
}
