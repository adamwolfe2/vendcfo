import { getSession } from "@vendcfo/supabase/cached-queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://vendcfo.vercel.app/api/webhook/plaid"
    : "https://vendcfo.vercel.app/api/webhook/plaid";

export async function POST(req: Request) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { accessToken } = body as { accessToken?: string };

    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;

    if (!plaidClientId || !plaidSecret) {
      return NextResponse.json(
        { error: "Plaid credentials not configured" },
        { status: 500 },
      );
    }

    const plaidBody: Record<string, unknown> = {
      client_id: plaidClientId,
      secret: plaidSecret,
      client_name: "VendCFO",
      products: ["transactions"],
      language: "en",
      country_codes: ["US", "CA"],
      webhook: WEBHOOK_URL,
      transactions: {
        days_requested: 730,
      },
      user: {
        client_user_id: session.user.id,
      },
    };

    // If accessToken is provided, this is a reconnect flow (update mode)
    // In update mode, we pass access_token instead of products
    if (accessToken) {
      plaidBody.access_token = accessToken;
      delete plaidBody.products;
    }

    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plaidBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[plaid/link-token] Plaid API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create link token", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      data: {
        link_token: data.link_token,
        expiration: data.expiration,
        request_id: data.request_id,
      },
    });
  } catch (error) {
    console.error("[plaid/link-token] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
