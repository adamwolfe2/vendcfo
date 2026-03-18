import { appRouter } from "@vendcfo/api/trpc/routers/_app";
import { verifyAccessToken } from "@vendcfo/api/utils/auth";
import { createClient } from "@vendcfo/api/services/supabase";
import { db } from "@vendcfo/db/client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
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

export { handler as GET, handler as POST };
