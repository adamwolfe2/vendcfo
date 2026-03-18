"use client";

import { Cookies } from "@/utils/constants";
import type { AppRouter } from "@vendcfo/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import type { TRPCLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
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
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}

/**
 * No-op link that returns empty data for all TRPC calls in mock/demo mode.
 * Prevents client-side TRPC from hitting a non-existent API server.
 */
const mockLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return {
      subscribe: (observer: any) => {
        observer.next({ result: { type: "data", data: null } });
        observer.complete();
        return { unsubscribe: () => {} };
      },
    } as any;
  };
};

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: isMockMode
        ? [mockLink()]
        : [
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

                // Pass force-primary cookie as header to API for replication lag handling
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
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
