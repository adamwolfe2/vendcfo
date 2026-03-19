import { Apps } from "@/components/apps";
import { AppsHeader } from "@/components/apps-header";
import { AppsSkeleton } from "@/components/apps.skeleton";
import {
  HydrateClient,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Apps | VendCFO",
};

export default async function Page() {
  const queryClient = getQueryClient();

  try {
    const caller = await getServerCaller();

    const results = await Promise.allSettled([
      caller.apps.get(),
      caller.oauthApplications.list(),
      caller.oauthApplications.authorized(),
      caller.inboxAccounts.get(),
      caller.invoicePayments.stripeStatus(),
    ]);

    if (results[0].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.apps.get.queryOptions().queryKey,
        results[0].value,
      );
    }
    if (results[1].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.oauthApplications.list.queryOptions().queryKey,
        results[1].value,
      );
    }
    if (results[2].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.oauthApplications.authorized.queryOptions().queryKey,
        results[2].value,
      );
    }
    if (results[3].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.inboxAccounts.get.queryOptions().queryKey,
        results[3].value,
      );
    }
    if (results[4].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.invoicePayments.stripeStatus.queryOptions().queryKey,
        results[4].value,
      );
    }
  } catch (error) {
    console.error("[AppsPage] Failed to prefetch via direct caller:", error);
  }

  return (
    <HydrateClient>
      <div className="mt-4">
        <AppsHeader />

        <Suspense fallback={<AppsSkeleton />}>
          <Apps />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
