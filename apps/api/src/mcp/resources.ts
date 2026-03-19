import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CATEGORIES } from "@vendcfo/categories";
import { getTags, getTeamById } from "@vendcfo/db/queries";
import { type McpContext, hasScope } from "./types";

export function registerResources(server: McpServer, ctx: McpContext): void {
  const { db, teamId } = ctx;

  // Team info requires teams.read scope
  if (hasScope(ctx, "teams.read")) {
    server.registerResource(
      "team",
      "vendhub://team/info",
      {
        description:
          "Current team information including name, base currency, and settings",
        mimeType: "application/json",
      },
      async () => {
        const team = await getTeamById(db, teamId);
        return {
          contents: [
            {
              uri: "vendhub://team/info",
              mimeType: "application/json",
              text: JSON.stringify(team, null, 2),
            },
          ],
        };
      },
    );
  }

  // Categories are static data, available to all authenticated users
  server.registerResource(
    "categories",
    "vendhub://categories",
    {
      description:
        "List of all transaction categories with their hierarchy, colors, and slugs",
      mimeType: "application/json",
    },
    async () => {
      return {
        contents: [
          {
            uri: "vendhub://categories",
            mimeType: "application/json",
            text: JSON.stringify(CATEGORIES, null, 2),
          },
        ],
      };
    },
  );

  // Tags require tags.read scope
  if (hasScope(ctx, "tags.read")) {
    server.registerResource(
      "tags",
      "vendhub://tags",
      {
        description: "List of all custom tags used for organizing data",
        mimeType: "application/json",
      },
      async () => {
        const tags = await getTags(db, { teamId });
        return {
          contents: [
            {
              uri: "vendhub://tags",
              mimeType: "application/json",
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      },
    );
  }
}
