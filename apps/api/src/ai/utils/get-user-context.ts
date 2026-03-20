import type { Database } from "@db/client";
import {
  type ChatTeamContext,
  type ChatUserContext,
  chatCache,
} from "@vendcfo/cache/chat-cache";
import { getBankAccounts, getTeamById, getUserById } from "@vendcfo/db/queries";
import { transactions } from "@vendcfo/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@vendcfo/logger";
import { HTTPException } from "hono/http-exception";

interface GetUserContextParams {
  db: Database;
  userId: string;
  teamId: string;
  country?: string;
  city?: string;
  timezone?: string;
}

/**
 * Gets user context for chat operations, with caching support
 * Fetches team and user data if not cached, then caches the result
 */
export async function getUserContext({
  db,
  userId,
  teamId,
  country,
  city,
  timezone,
}: GetUserContextParams): Promise<ChatUserContext> {
  // Try to get cached context first
  const cached = await chatCache.getUserContext(userId, teamId);

  // Get team context (cached separately)
  let teamContext = await chatCache.getTeamContext(teamId);

  // If team context not cached, fetch bank account status
  if (!teamContext) {
    let hasBankAccounts = false;
    try {
      const bankAccounts = await getBankAccounts(db, {
        teamId,
        enabled: true,
      });
      hasBankAccounts = bankAccounts.length > 0;
    } catch {
      // getBankAccounts may fail with relational query — fall back to simple check
    }

    // Also check if team has any transactions (covers manual imports, CSV uploads)
    let hasTransactions = false;
    try {
      const txnCheck = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.teamId, teamId))
        .limit(1);
      hasTransactions = txnCheck.length > 0;
    } catch {
      // Ignore query errors
    }

    teamContext = {
      teamId,
      hasBankAccounts: hasBankAccounts || hasTransactions,
      hasTransactions,
    };

    // Cache team context (non-blocking)
    chatCache.setTeamContext(teamId, teamContext).catch((err) => {
      logger.warn("Failed to cache team context", {
        teamId,
        error: err.message,
      });
    });
  }

  // If user context is cached, merge team context and return
  if (cached) {
    return {
      ...cached,
      hasBankAccounts: teamContext.hasBankAccounts,
    };
  }

  // If not cached, fetch team and user data in parallel
  const [team, user] = await Promise.all([
    getTeamById(db, teamId),
    getUserById(db, userId),
  ]);

  if (!team || !user) {
    throw new HTTPException(404, {
      message: "User or team not found",
    });
  }

  const context: ChatUserContext = {
    userId,
    teamId,
    teamName: team.name,
    fullName: user.fullName,
    fiscalYearStartMonth: team.fiscalYearStartMonth,
    baseCurrency: team.baseCurrency,
    locale: user.locale ?? "en-US",
    dateFormat: user.dateFormat,
    country,
    city,
    timezone,
    hasBankAccounts: teamContext.hasBankAccounts,
  };

  // Cache for future requests (non-blocking)
  chatCache.setUserContext(userId, teamId, context).catch((err) => {
    logger.warn("Failed to cache user context", {
      userId,
      teamId,
      error: err.message,
    });
  });

  return context;
}
