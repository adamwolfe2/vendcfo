import "server-only";

import type { AppRouter } from "@vendcfo/api/trpc/routers/_app";
import { createClient } from "@vendcfo/supabase/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { cookies } from "next/headers";
import { cache } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Use the full URL for server-side calls — on Vercel, VERCEL_URL is the deployment URL
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
          const supabase = await createClient();
          const cookieStore = await cookies();

          const {
            data: { session },
          } = await supabase.auth.getSession();

          const headers: Record<string, string> = {
            Authorization: `Bearer ${session?.access_token}`,
          };

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
 * Get a tRPC client for server-side API routes
 */
export async function getTRPCClient() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }),
    ],
  });
}
