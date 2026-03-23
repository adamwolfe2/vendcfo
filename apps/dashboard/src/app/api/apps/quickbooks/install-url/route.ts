import {
  encryptAccountingOAuthState,
  getAccountingProvider,
} from "@vendcfo/accounting";
import { db } from "@vendcfo/db/client";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (
      !process.env.QUICKBOOKS_CLIENT_ID ||
      !process.env.QUICKBOOKS_CLIENT_SECRET ||
      !process.env.QUICKBOOKS_OAUTH_REDIRECT_URL
    ) {
      return NextResponse.json(
        {
          error:
            "QuickBooks integration is not configured. Set QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, and QUICKBOOKS_OAUTH_REDIRECT_URL environment variables.",
        },
        { status: 501 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use Drizzle directly to bypass RLS on users table
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, authUser.id),
      columns: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "Team not found" }, { status: 401 });
    }

    const state = encryptAccountingOAuthState({
      teamId: user.teamId,
      userId: authUser.id,
      provider: "quickbooks",
      source: "apps",
    });

    const provider = getAccountingProvider("quickbooks");
    const url = await provider.buildConsentUrl(state);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[QuickBooks Install URL] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "QuickBooks OAuth configuration missing",
      },
      { status: 500 },
    );
  }
}
