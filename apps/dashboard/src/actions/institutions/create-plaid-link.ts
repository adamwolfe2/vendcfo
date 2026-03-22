"use server";

import { getSession } from "@vendcfo/supabase/cached-queries";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL || "https://vendcfo.vercel.app"}/api/webhook/plaid`;

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
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

  // If accessToken is provided, this is a reconnect/update flow
  // In update mode, pass access_token instead of products
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
    console.error("[create-plaid-link] Plaid API error:", errorData);
    throw new Error("Failed to create plaid link token");
  }

  const data = await response.json();

  return data.link_token;
};
