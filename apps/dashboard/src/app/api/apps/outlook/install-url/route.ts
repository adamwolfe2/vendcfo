import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.OUTLOOK_CLIENT_ID ||
    !process.env.OUTLOOK_CLIENT_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Outlook integration is not yet configured. A Microsoft Azure app registration is required. Contact support for setup details.",
      },
      { status: 501 },
    );
  }

  // TODO: Implement Outlook OAuth flow once credentials are configured
  return NextResponse.json(
    { error: "Outlook OAuth flow not yet implemented" },
    { status: 501 },
  );
}
