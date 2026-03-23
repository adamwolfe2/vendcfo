import { db } from "@vendcfo/db/client";
import { InboxConnector } from "@vendcfo/inbox/connector";
import { encryptOAuthState } from "@vendcfo/inbox/utils";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { getUserQuery } from "@vendcfo/supabase/queries";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "Gmail integration is not yet configured. A Google Cloud project with Gmail API access is required.",
      },
      { status: 501 },
    );
  }

  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: user } = await getUserQuery(supabase, session.user.id);

    if (!user?.team_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 401 });
    }

    const state = encryptOAuthState({
      teamId: user.team_id,
      provider: "gmail",
      source: "apps",
    });

    const connector = new InboxConnector("gmail", db);
    const url = await connector.connect(state);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Gmail Install URL] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Gmail OAuth URL",
      },
      { status: 500 },
    );
  }
}
