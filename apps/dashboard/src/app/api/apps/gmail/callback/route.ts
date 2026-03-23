import { db } from "@vendcfo/db/client";
import { InboxConnector } from "@vendcfo/inbox/connector";
import { decryptOAuthState } from "@vendcfo/inbox/utils";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const dashboardUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.MIDDAY_DASHBOARD_URL ||
    "https://vendcfo.vercel.app";

  if (!state) {
    return NextResponse.redirect(
      `${dashboardUrl}/oauth-callback?status=error&error=invalid_state`,
    );
  }

  let parsedState: ReturnType<typeof decryptOAuthState>;
  try {
    parsedState = decryptOAuthState(state);
  } catch (err) {
    console.error("[Gmail Callback] Failed to decrypt state:", err);
    return NextResponse.redirect(
      `${dashboardUrl}/oauth-callback?status=error&error=invalid_state`,
    );
  }

  const source = parsedState?.source;

  if (error || !code) {
    const errorCode = error || "access_denied";
    console.info("Gmail OAuth error or cancelled", { error, errorCode });

    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=error&error=${errorCode}`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/inbox?connected=false&error=${errorCode}&provider=gmail`,
    );
  }

  if (!parsedState || parsedState.provider !== "gmail") {
    return NextResponse.redirect(
      `${dashboardUrl}/oauth-callback?status=error&error=invalid_state`,
    );
  }

  try {
    const connector = new InboxConnector("gmail", db);

    const account = await connector.exchangeCodeForAccount({
      code,
      teamId: parsedState.teamId,
    });

    if (!account) {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=error&error=token_exchange_failed`,
      );
    }

    console.info("Gmail inbox account created successfully", {
      teamId: parsedState.teamId,
      accountId: account.id,
    });

    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=success`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/inbox?connected=true&provider=gmail`,
    );
  } catch (err) {
    console.error("[Gmail Callback] Error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=error&error=token_exchange_failed`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/inbox?connected=false&error=token_exchange_failed&provider=gmail`,
    );
  }
}
