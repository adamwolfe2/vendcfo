"use client";

import { Cookies } from "@/utils/constants";
import type { AppRouter } from "@vendcfo/api/trpc/routers/_app";
import { createClient } from "@vendcfo/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import {
  type TRPCLink,
  createTRPCClient,
  httpBatchLink,
  loggerLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function isDemoMode(): boolean {
  if (typeof window !== "undefined" && (window as any).__VENDCFO_DEMO__) {
    return true;
  }
  return getCookie("vendcfo-demo") === "true";
}

/**
 * Mock TRPC link for demo mode — returns empty/null results
 * instead of making HTTP calls that would fail without auth.
 */
const demoLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      // Return null/empty for all queries in demo mode
      observer.next({
        result: {
          type: "data",
          data: null,
        },
      });
      observer.complete();
    });
  };
};

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
    // In demo mode, use mock link to avoid 500 errors
    if (!isServer && isDemoMode()) {
      return createTRPCClient<AppRouter>({
        links: [demoLink],
      });
    }

    return createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          async headers() {
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
