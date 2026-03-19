"use server";

import { getSession } from "@vendcfo/supabase/cached-queries";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

export const exchangePublicToken = async (token: string) => {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const plaidClientId = process.env.PLAID_CLIENT_ID;
  const plaidSecret = process.env.PLAID_SECRET;

  if (!plaidClientId || !plaidSecret) {
    throw new Error("Plaid credentials not configured");
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
    console.error("[exchange-public-token] Plaid API error:", errorData);
    throw new Error("Failed to exchange public token");
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    item_id: data.item_id,
  };
};
