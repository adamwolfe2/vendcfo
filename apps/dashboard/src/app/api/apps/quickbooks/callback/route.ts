import {
  QUICKBOOKS_SCOPES,
  decryptAccountingOAuthState,
  getAccountingProvider,
} from "@vendcfo/accounting";
import config from "@vendcfo/app-store/quickbooks";
import { db } from "@vendcfo/db/client";
import { createApp } from "@vendcfo/db/queries";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
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

  // Decrypt and validate state — catch errors from missing encryption key
  let parsedState: ReturnType<typeof decryptAccountingOAuthState>;
  try {
    parsedState = decryptAccountingOAuthState(state);
  } catch (err) {
    console.error("[QuickBooks Callback] Failed to decrypt state:", err);
    return NextResponse.redirect(
      `${dashboardUrl}/oauth-callback?status=error&error=invalid_state`,
    );
  }
  const source = parsedState?.source;

  // Handle OAuth errors (user denied access, etc.)
  if (error || !code || !realmId) {
    const errorCode = error || "missing_params";
    console.info("QuickBooks OAuth error or cancelled", { error, errorCode });

    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=error&error=${errorCode}`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/settings/apps?connected=false&error=${errorCode}&provider=quickbooks`,
    );
  }

  // Validate state
  if (!parsedState || parsedState.provider !== "quickbooks") {
    return NextResponse.redirect(
      `${dashboardUrl}/oauth-callback?status=error&error=invalid_state`,
    );
  }

  try {
    const provider = getAccountingProvider("quickbooks");

    // Build the full callback URL that includes the code and realmId
    const callbackUrl = new URL(request.url);

    // Exchange code for tokens
    const tokenSet = await provider.exchangeCodeForTokens(
      callbackUrl.toString(),
    );

    // Get company information using provider with stored tokens
    const providerWithTokens = getAccountingProvider("quickbooks", {
      provider: "quickbooks",
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken,
      expiresAt: tokenSet.expiresAt.toISOString(),
      realmId,
    });

    const companyInfo = await providerWithTokens.getTenantInfo(realmId);

    // Create app integration in database
    await createApp(db, {
      teamId: parsedState.teamId,
      createdBy: parsedState.userId,
      appId: config.id,
      settings: config.settings,
      config: {
        provider: "quickbooks",
        accessToken: tokenSet.accessToken,
        refreshToken: tokenSet.refreshToken,
        expiresAt: tokenSet.expiresAt.toISOString(),
        realmId,
        companyName: companyInfo.name,
        scope: QUICKBOOKS_SCOPES,
      },
    });

    console.info("QuickBooks integration created successfully", {
      teamId: parsedState.teamId,
      realmId,
      companyName: companyInfo.name,
    });

    // Redirect based on source
    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=success`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/settings/apps?connected=true&provider=quickbooks`,
    );
  } catch (err) {
    console.error("QuickBooks OAuth callback error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    if (source === "apps") {
      return NextResponse.redirect(
        `${dashboardUrl}/oauth-callback?status=error&error=token_exchange_failed`,
      );
    }
    return NextResponse.redirect(
      `${dashboardUrl}/settings/apps?connected=false&error=token_exchange_failed&provider=quickbooks`,
    );
  }
}
