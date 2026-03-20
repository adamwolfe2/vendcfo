import type { AppContext } from "@api/ai/agents/config/shared";

export function checkBankAccountsRequired(appContext: AppContext): {
  hasBankAccounts: boolean;
  shouldYield: boolean;
} {
  // Consider the user as having financial data if they have bank accounts
  // OR if they have any transactions (manual import, CSV upload, etc.)
  const hasBankAccounts = appContext.hasBankAccounts ?? false;
  const hasTransactions = appContext.hasTransactions ?? false;
  return {
    hasBankAccounts: hasBankAccounts || hasTransactions,
    shouldYield: !hasBankAccounts && !hasTransactions,
  };
}
