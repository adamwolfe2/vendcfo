"use client";

import { Cookies } from "@/utils/constants";
import type { AppRouter } from "@vendcfo/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { observable } from "@trpc/server/observable";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_UI === "true";

// Helper to get cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => {
    // In mock/demo mode, use a no-op link that returns null for everything
    // This prevents client-side TRPC from hitting the non-existent API server
    if (isMockMode) {
      return createTRPCClient<AppRouter>({
        links: [
          () =>
            ({ op }) =>
              observable((observer) => {
                if (typeof window === "undefined") {
                  // SERVER: resolve immediately with empty data so SSR completes
                  // without hanging. The server must finish rendering quickly.
                  observer.next({
                    result: { type: "data" as const, data: undefined },
                  } as any);
                  observer.complete();
                }
                // CLIENT: never resolve — keeps queries in "loading" state.
                // Components show skeleton/loading UI instead of crashing
                // on undefined data from a non-existent API server.
                // React Query's useQuery returns { data: undefined, isLoading: true }
              }),
        ],
      });
    }

    return createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const { createClient } = await import(
              "@vendcfo/supabase/client"
            );
            const supabase = createClient();

            const {
              data: { session },
            } = await supabase.auth.getSession();

            const headers: Record<string, string> = {
              Authorization: `Bearer ${session?.access_token}`,
            };

            const forcePrimary = getCookie(Cookies.ForcePrimary);
            if (forcePrimary === "true") {
              headers["x-force-primary"] = "true";
            }

            return headers;
          },
        }),
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
      ],
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
