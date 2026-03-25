import { db } from "@vendcfo/db/client";
import { InboxConnector } from "@vendcfo/inbox/connector";
import { encryptOAuthState } from "@vendcfo/inbox/utils";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "Outlook integration is not yet configured. A Microsoft Azure app registration is required.",
      },
      { status: 501 },
    );
  }

  try {
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

    const state = encryptOAuthState({
      teamId: user.teamId,
      provider: "outlook",
      source: "apps",
    });

    const connector = new InboxConnector("outlook", db);
    const url = await connector.connect(state);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Outlook Install URL] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Outlook OAuth URL",
      },
      { status: 500 },
    );
  }
}
