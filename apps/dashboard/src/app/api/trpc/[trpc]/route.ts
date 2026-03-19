import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

// Force dynamic — skip static page data collection at build time
// (the router imports Resend, Stripe, etc. which need API keys at init)
export const dynamic = "force-dynamic";

const handler = async (req: NextRequest) => {
  // Lazy imports — only load the heavy router + DB at request time,
  // not at build/module-evaluation time
  const { appRouter } = await import("@vendcfo/api/trpc/routers/_app");
  const { verifyAccessToken } = await import("@vendcfo/api/utils/auth");
  const { createClient } = await import("@vendcfo/api/services/supabase");
  const { db } = await import("@vendcfo/db/client");

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      const accessToken = authHeader?.split(" ")[1];
      const session = await verifyAccessToken(accessToken);
      const supabase = await createClient(accessToken);

      const geo = {
        country: req.headers.get("x-user-country")?.toUpperCase() ?? null,
        locale: req.headers.get("x-user-locale") ?? null,
        timezone: req.headers.get("x-user-timezone") ?? null,
        ip: req.headers.get("x-forwarded-for") ?? null,
      };

      const forcePrimary =
        req.headers.get("x-force-primary") === "true";

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
