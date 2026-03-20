import {
  getAccountsSchema,
  getInstitutionsSchema,
  updateUsageSchema,
} from "@api/schemas/institutions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { TRPCError } from "@trpc/server";
import { client } from "@vendcfo/engine-client";

const PLAID_BASE_URL =
  process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT === "sandbox"
    ? "https://sandbox.plaid.com"
    : "https://production.plaid.com";

function getLogoURL(id: string) {
  return `https://cdn-engine.vendhub.com/${id}.jpg`;
}

function getAccountType(
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

function transformPlaidBalance(
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

async function fetchPlaidAccounts(accessToken: string, institutionId: string) {
  const plaidClientId = process.env.PLAID_CLIENT_ID;
  const plaidSecret = process.env.PLAID_SECRET;

  if (!plaidClientId || !plaidSecret) {
    throw new Error("Plaid credentials not configured");
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
    throw new Error("Failed to get Plaid accounts");
  }

  const accountsData = await accountsResponse.json();

  // Fetch institution name from Plaid
  let institutionName = institutionId;
  try {
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
          options: { include_auth_metadata: true },
        }),
      },
    );
    if (institutionResponse.ok) {
      const instData = await institutionResponse.json();
      institutionName = instData.institution?.name ?? institutionId;
    }
  } catch {
    // Non-critical - use institution ID as fallback
  }

  return accountsData.accounts.map(
    (account: {
      account_id: string;
      name: string;
      balances: PlaidBalance;
      type: string;
      subtype: string | null;
      mask: string | null;
      persistent_account_id?: string;
    }) => {
      const accountType = getAccountType(account.type);
      return {
        id: account.account_id,
        name: account.name,
        currency:
          account.balances?.iso_currency_code?.toUpperCase() ||
          account.balances?.unofficial_currency_code?.toUpperCase() ||
          "USD",
        type: accountType,
        enrollment_id: null,
        balance: transformPlaidBalance(account.balances, accountType),
        institution: {
          id: institutionId,
          name: institutionName,
          logo: getLogoURL(institutionId),
          provider: "plaid",
        },
        resource_id: account.persistent_account_id || account.mask || null,
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
}

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInstitutionsSchema)
    .query(async ({ input }) => {
      const institutionsResponse = await client.institutions.$get({
        query: input,
      });

      if (!institutionsResponse.ok) {
        throw new Error("Failed to get institutions");
      }

      const { data } = await institutionsResponse.json();

      return data.map((institution) => ({
        ...institution,
        availableHistory: institution.available_history,
        maximumConsentValidity: institution.maximum_consent_validity,
        type: institution.type,
        provider: institution.provider!,
      }));
    }),

  accounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      try {
        // For Plaid, call the Plaid API directly instead of the engine
        if (
          input.provider === "plaid" &&
          input.accessToken &&
          input.institutionId
        ) {
          const data = await fetchPlaidAccounts(
            input.accessToken,
            input.institutionId,
          );
          return data.sort(
            (
              a: { balance: { amount: number } },
              b: { balance: { amount: number } },
            ) => b.balance.amount - a.balance.amount,
          );
        }

        // For other providers, use the engine client
        const accountsResponse = await client.accounts.$get({
          query: input,
        });

        if (!accountsResponse.ok) {
          throw new Error("Failed to get accounts");
        }

        const { data } = await accountsResponse.json();

        return data.sort((a, b) => b.balance.amount - a.balance.amount);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get accounts",
        });
      }
    }),

  updateUsage: protectedProcedure
    .input(updateUsageSchema)
    .mutation(async ({ input }) => {
      const usageResponse = await client.institutions[":id"].usage.$put({
        param: input,
      });

      if (!usageResponse.ok) {
        throw new Error("Failed to update institution usage");
      }

      return usageResponse.json();
    }),
});
