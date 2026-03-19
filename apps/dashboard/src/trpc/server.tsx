import "server-only";

import type { AppRouter } from "@vendcfo/api/trpc/routers/_app";
import { createClient } from "@vendcfo/supabase/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { cache } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

/**
 * Get a Supabase access token from the current server-side session.
 * Cached per-request to avoid multiple cookie reads.
 */
const getAccessToken = cache(async (): Promise<string | undefined> => {
  const supabase = await createClient();
  // Use getSession for the access token (getUser doesn't return it).
  // The middleware already verifies the user via getUser() — this just
  // extracts the JWT for the TRPC context.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? undefined;
});

/**
 * Create a direct server-side TRPC caller that bypasses HTTP entirely.
 * This avoids the serverless self-call problem on Vercel.
 */
const getServerCaller = cache(async () => {
  const { appRouter } = await import("@vendcfo/api/trpc/routers/_app");
  const { createCallerFactory } = await import("@vendcfo/api/trpc/init");
  const { verifyAccessToken } = await import("@vendcfo/api/utils/auth");
  const {
    createClient: createApiSupabase,
  } = await import("@vendcfo/api/services/supabase");
  const { db } = await import("@vendcfo/db/client");

  const accessToken = await getAccessToken();
  let session = await verifyAccessToken(accessToken);

  // Fallback: if JWT verification failed (e.g. SUPABASE_JWT_SECRET missing/wrong),
  // build the session from supabase.auth.getUser() which uses the cookie directly.
  // This prevents the middleware passing auth but the TRPC layer rejecting it.
  if (!session && accessToken) {
    try {
      const supabaseForAuth = await createClient();
      const { data: { user } } = await supabaseForAuth.auth.getUser();
      if (user) {
        session = {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
          },
        };
      }
    } catch {
      // getUser failed too — session truly invalid
    }
  }

  const supabase = await createApiSupabase(accessToken);

  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    session,
    supabase,
    db,
    geo: {
      country: null,
      locale: null,
      timezone: null,
      ip: null,
    },
    forcePrimary: false,
  });
});

/**
 * Server-side TRPC options proxy for use with TanStack Query prefetching.
 *
 * Uses httpBatchLink pointed at the same origin. The actual data fetching
 * for server components goes through `getServerCaller()` (direct caller),
 * while this proxy generates queryOptions objects for prefetching.
 *
 * On Vercel, VERCEL_URL provides the deployment URL for self-calls.
 * In practice, most server-side data is fetched via the direct caller.
 */
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3001";
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const accessToken = await getAccessToken();
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
          }
          return headers;
        },
      }),
    ],
  }),
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

export function batchPrefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptionsArray: T[],
) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      void queryClient.prefetchQuery(queryOptions);
    }
  }
}

/**
 * Get a direct TRPC caller for server-side use (no HTTP).
 * Use this instead of getTRPCClient() for server components and API routes.
 */
export { getServerCaller };

/**
 * Get a tRPC HTTP client for server-side API routes.
 * Prefer getServerCaller() for direct in-process calls.
 */
export async function getTRPCClient() {
  const accessToken = await getAccessToken();

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ],
  });
}
