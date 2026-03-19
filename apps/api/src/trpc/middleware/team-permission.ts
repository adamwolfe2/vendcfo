import type { Session } from "@api/utils/auth";
import { TRPCError } from "@trpc/server";
import { teamCache } from "@vendcfo/cache/team-cache";
import type { Database } from "@vendcfo/db/client";
import { users, usersOnTeam } from "@vendcfo/db/schema";
import { eq } from "drizzle-orm";

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string | null;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Use simple queries instead of relational API (lateral joins fail on Supabase pooler)
  const [userRow] = await ctx.db
    .select({ id: users.id, teamId: users.teamId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) {
    console.warn(`[team-permission] User ${userId} not found in public.users`);
    return next({
      ctx: {
        session: ctx.session,
        teamId: null,
        db: ctx.db,
      },
    });
  }

  const teamId = userRow.teamId;

  if (teamId !== null) {
    const cacheKey = `user:${userId}:team:${teamId}`;
    let hasAccess = await teamCache.get(cacheKey);

    if (hasAccess === undefined) {
      const memberships = await ctx.db
        .select({ teamId: usersOnTeam.teamId })
        .from(usersOnTeam)
        .where(eq(usersOnTeam.userId, userId));

      hasAccess = memberships.some((m) => m.teamId === teamId);
      await teamCache.set(cacheKey, hasAccess);
    }

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No permission to access this team",
      });
    }
  }

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
