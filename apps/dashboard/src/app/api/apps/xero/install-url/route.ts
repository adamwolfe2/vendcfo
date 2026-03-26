import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.XERO_CLIENT_ID ||
    !process.env.XERO_CLIENT_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Xero integration is not yet configured. A Xero developer app registration is required. Contact support for setup details.",
      },
      { status: 501 },
    );
  }

  // TODO: Implement Xero OAuth flow once credentials are configured
  return NextResponse.json(
    { error: "Xero OAuth flow not yet implemented" },
    { status: 501 },
  );
}
