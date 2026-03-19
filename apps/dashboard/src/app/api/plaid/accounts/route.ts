import { getSession } from "@vendcfo/supabase/cached-queries";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

function getLogoURL(id: string) {
  return `https://cdn-engine.vendhub.com/${id}.jpg`;
}

function getType(
  type: string,
): "depository" | "credit" | "other_asset" | "loan" | "other_liability" {
  switch (type) {
    case "depository":
      return "depository";
    case "credit":
      return "credit";
    case "loan":
      return "loan";
    default:
      return "other_asset";
  }
}

type PlaidBalance = {
  available: number | null;
  current: number | null;
  limit: number | null;
  iso_currency_code: string | null;
  unofficial_currency_code: string | null;
};

function transformAccountBalance(
  balances: PlaidBalance | undefined,
  accountType: string,
) {
  const amount =
    accountType === "credit"
      ? (balances?.current ?? 0)
      : (balances?.available ?? balances?.current ?? 0);

  return {
    currency:
      balances?.iso_currency_code?.toUpperCase() ||
      balances?.unofficial_currency_code?.toUpperCase() ||
      "USD",
    amount,
    available_balance: balances?.available ?? null,
    credit_limit: balances?.limit ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { accessToken, institutionId } = body as {
      accessToken?: string;
      institutionId?: string;
    };

    if (!accessToken || !institutionId) {
      return NextResponse.json(
        { error: "Missing accessToken or institutionId" },
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

    // Fetch accounts from Plaid
    const accountsResponse = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: accessToken,
      }),
    });

    if (!accountsResponse.ok) {
      const errorData = await accountsResponse.json().catch(() => ({}));
      console.error("[plaid/accounts] Plaid API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get accounts", details: errorData },
        { status: accountsResponse.status },
      );
    }

    const accountsData = await accountsResponse.json();

    // Fetch institution details from Plaid
    const institutionResponse = await fetch(
      `${PLAID_BASE_URL}/institutions/get_by_id`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          institution_id: institutionId,
          country_codes: ["US", "CA"],
          options: {
            include_auth_metadata: true,
          },
        }),
      },
    );

    let institutionName = institutionId;
    if (institutionResponse.ok) {
      const instData = await institutionResponse.json();
      institutionName = instData.institution?.name ?? institutionId;
    }

    // Transform accounts to match the engine's response format
    const data = accountsData.accounts.map(
      (account: {
        account_id: string;
        name: string;
        balances: PlaidBalance;
        type: string;
        subtype: string | null;
        mask: string | null;
        persistent_account_id?: string;
      }) => {
        const accountType = getType(account.type);
        return {
          id: account.account_id,
          name: account.name,
          currency:
            account.balances?.iso_currency_code?.toUpperCase() ||
            account.balances?.unofficial_currency_code?.toUpperCase() ||
            "USD",
          type: accountType,
          enrollment_id: null,
          balance: transformAccountBalance(account.balances, accountType),
          institution: {
            id: institutionId,
            name: institutionName,
            logo: getLogoURL(institutionId),
            provider: "plaid",
          },
          resource_id:
            account.persistent_account_id || account.mask || null,
          expires_at: null,
          iban: null,
          subtype: account.subtype || null,
          bic: null,
          routing_number: null,
          wire_routing_number: null,
          account_number: null,
          sort_code: null,
          available_balance: account.balances?.available ?? null,
          credit_limit: account.balances?.limit ?? null,
        };
      },
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[plaid/accounts] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
