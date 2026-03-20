"use server";

import { authActionClient } from "@/actions/safe-action";
import { tasks } from "@trigger.dev/sdk";
import { LogEvents } from "@vendcfo/events/events";
import type { SyncConnectionPayload } from "@vendcfo/jobs/schema";
import { z } from "zod";

export const manualSyncTransactionsAction = authActionClient
  .schema(
    z.object({
      connectionId: z.string(),
    }),
  )
  .metadata({
    name: "manual-sync-transactions",
    track: {
      event: LogEvents.TransactionsManualSync.name,
      channel: LogEvents.TransactionsManualSync.channel,
    },
  })
  .action(async ({ parsedInput: { connectionId } }) => {
    const event = await tasks.trigger("sync-connection", {
      connectionId,
      manualSync: true,
    } satisfies SyncConnectionPayload);

    return event;
  });
