import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.GMAIL_CLIENT_ID ||
    !process.env.GMAIL_CLIENT_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Gmail integration is not yet configured. A Google Cloud project with Gmail API access is required. Contact support for setup details.",
      },
      { status: 501 },
    );
  }

  // TODO: Implement Gmail OAuth flow once credentials are configured
  return NextResponse.json(
    { error: "Gmail OAuth flow not yet implemented" },
    { status: 501 },
  );
}
