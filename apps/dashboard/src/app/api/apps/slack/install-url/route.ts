import { getInstallUrl } from "@vendcfo/app-store/slack/server";
import { db } from "@vendcfo/db/client";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.SLACK_CLIENT_ID ||
    !process.env.SLACK_CLIENT_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Slack integration is not yet configured. A Slack app registration is required. Contact support for setup details.",
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

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, authUser.id),
      columns: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "Team not found" }, { status: 401 });
    }

    const url = await getInstallUrl({
      teamId: user.teamId,
      userId: authUser.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate Slack install URL";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
