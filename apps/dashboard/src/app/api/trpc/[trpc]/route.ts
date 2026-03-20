import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

// Force dynamic — skip static page data collection at build time
export const dynamic = "force-dynamic";

// ── Module-level cache for heavy imports ──
// These load once per serverless instance (warm start = zero import cost).
let _appRouter: any;
let _verifyAccessToken: any;
let _createClient: any;
let _db: any;
let _createDashboardSupabase: any;

async function getModules() {
  if (!_appRouter) {
    const [appModule, authModule, clientModule, dbModule, supabaseModule] =
      await Promise.all([
        import("@vendcfo/api/trpc/routers/_app"),
        import("@vendcfo/api/utils/auth"),
        import("@vendcfo/api/services/supabase"),
        import("@vendcfo/db/client"),
        import("@vendcfo/supabase/server"),
      ]);
    _appRouter = appModule.appRouter;
    _verifyAccessToken = authModule.verifyAccessToken;
    _createClient = clientModule.createClient;
    _db = dbModule.db;
    _createDashboardSupabase = supabaseModule.createClient;
  }
  return {
    appRouter: _appRouter,
    verifyAccessToken: _verifyAccessToken,
    createClient: _createClient,
    db: _db,
    createDashboardSupabase: _createDashboardSupabase,
  };
}

const handler = async (req: NextRequest) => {
  const { appRouter, verifyAccessToken, createClient, db, createDashboardSupabase } =
    await getModules();

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
