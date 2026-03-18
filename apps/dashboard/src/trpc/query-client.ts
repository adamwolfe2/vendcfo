import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import superjson from "superjson";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_UI === "true";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default staleTime of 2 minutes - queries won't refetch if data is fresh
        // For static data (user settings, team config), override with longer staleTime (5+ min)
        staleTime: 2 * 60 * 1000,
        // Keep unused data in cache for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000,
        // In mock mode: don't retry failed queries, don't throw on errors
        ...(isMockMode && {
          retry: false,
          throwOnError: false,
        }),
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) => {
          // In mock mode, don't dehydrate any queries — let client start fresh in loading state
          if (isMockMode) return false;
          return (
            defaultShouldDehydrateQuery(query) ||
            query.state.status === "pending"
          );
        },
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
