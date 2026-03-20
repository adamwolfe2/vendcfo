import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  encryptAccountingOAuthState,
  getAccountingProvider,
} from "@vendcfo/accounting";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const installUrlResponseSchema = z.object({
  url: z.string().url(),
});

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Get Fortnox install URL",
    operationId: "getFortnoxInstallUrl",
    description:
      "Generates OAuth install URL for Fortnox integration. Requires authentication.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Fortnox install URL",
        content: {
          "application/json": {
            schema: installUrlResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Server error",
      },
    },
  }),
  async (c) => {
    const session = c.get("session");

    if (!session?.user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    if (!session.teamId) {
      throw new HTTPException(401, {
        message: "Team not found",
      });
    }

    // Check required env vars early
    if (
      !process.env.FORTNOX_CLIENT_ID ||
      !process.env.FORTNOX_CLIENT_SECRET ||
      !process.env.FORTNOX_OAUTH_REDIRECT_URL
    ) {
      throw new HTTPException(501, {
        message:
          "Fortnox integration is not configured. Set FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET, and FORTNOX_OAUTH_REDIRECT_URL environment variables.",
      });
    }

    try {
      // Encrypt state to prevent tampering with teamId
      const state = encryptAccountingOAuthState({
        teamId: session.teamId,
        userId: session.user.id,
        provider: "fortnox",
        source: "apps",
      });

      const provider = getAccountingProvider("fortnox");
      const url = await provider.buildConsentUrl(state);
      return c.json({ url });
    } catch (error) {
      throw new HTTPException(500, {
        message:
          error instanceof Error
            ? error.message
            : "Fortnox OAuth configuration missing",
      });
    }
  },
);

export { app as installUrlRouter };
