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

  // TODO: Implement Slack OAuth flow once credentials are configured
  return NextResponse.json(
    { error: "Slack OAuth flow not yet implemented" },
    { status: 501 },
  );
}
