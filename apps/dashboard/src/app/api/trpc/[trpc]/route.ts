import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

// Force dynamic — skip static page data collection at build time
export const dynamic = "force-dynamic";

const handler = async (req: NextRequest) => {
  const { appRouter } = await import("@vendcfo/api/trpc/routers/_app");
  const { verifyAccessToken } = await import("@vendcfo/api/utils/auth");
  const { createClient } = await import("@vendcfo/api/services/supabase");
  const { db } = await import("@vendcfo/db/client");
  const { createClient: createDashboardSupabase } = await import(
    "@vendcfo/supabase/server"
  );

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      const accessToken = authHeader?.split(" ")[1];

      // Primary auth: cookie-based (most reliable, works regardless of JWT_SECRET)
      let session = null;
      try {
        const supabaseAuth = await createDashboardSupabase();
        const {
          data: { user },
        } = await supabaseAuth.auth.getUser();
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
        // Cookie auth failed, try JWT fallback
      }

      // Fallback: JWT verification from Bearer token
      if (!session && accessToken) {
        session = await verifyAccessToken(accessToken);
      }

      const supabase = await createClient(accessToken);

      const geo = {
        country: req.headers.get("x-user-country")?.toUpperCase() ?? null,
        locale: req.headers.get("x-user-locale") ?? null,
        timezone: req.headers.get("x-user-timezone") ?? null,
        ip: req.headers.get("x-forwarded-for") ?? null,
      };

      const forcePrimary = req.headers.get("x-force-primary") === "true";

      return {
        session,
        supabase,
        db,
        geo,
        forcePrimary,
      };
    },
  });
};

export { handler as GET, handler as POST };
