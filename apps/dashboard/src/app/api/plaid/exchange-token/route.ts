import { getSession } from "@vendcfo/supabase/cached-queries";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

export async function POST(req: Request) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json(
        { error: "Missing public token" },
        { status: 400 },
      );
    }

    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;

    if (!plaidClientId || !plaidSecret) {
      return NextResponse.json(
        { error: "Plaid credentials not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${PLAID_BASE_URL}/item/public_token/exchange`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          public_token: token,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[plaid/exchange-token] Plaid API error:", errorData);
      return NextResponse.json(
        { error: "Failed to exchange token", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      data: {
        access_token: data.access_token,
        item_id: data.item_id,
      },
    });
  } catch (error) {
    console.error("[plaid/exchange-token] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
