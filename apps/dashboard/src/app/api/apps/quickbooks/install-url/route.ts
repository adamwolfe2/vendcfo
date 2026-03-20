import {
  encryptAccountingOAuthState,
  getAccountingProvider,
} from "@vendcfo/accounting";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { getUserQuery } from "@vendcfo/supabase/queries";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user record to find their active team
  const supabase = await createClient();
  const { data: user } = await getUserQuery(supabase, session.user.id);

  if (!user?.team_id) {
    return NextResponse.json({ error: "Team not found" }, { status: 401 });
  }

  // Encrypt state to prevent tampering with teamId
  const state = encryptAccountingOAuthState({
    teamId: user.team_id,
    userId: session.user.id,
    provider: "quickbooks",
    source: "apps",
  });

  try {
    const provider = getAccountingProvider("quickbooks");
    const url = await provider.buildConsentUrl(state);
    return NextResponse.json({ url });
  } catch (error) {
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
