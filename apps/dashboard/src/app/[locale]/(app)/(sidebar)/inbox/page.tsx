import { Inbox } from "@/components/inbox";
import { InboxConnectedEmpty } from "@/components/inbox/inbox-empty";
import { InboxGetStarted } from "@/components/inbox/inbox-get-started";
import { InboxViewSkeleton } from "@/components/inbox/inbox-skeleton";
import { InboxView } from "@/components/inbox/inbox-view";
import { loadInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { loadInboxParams } from "@/hooks/use-inbox-params";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | VendCFO",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const filter = loadInboxFilterParams(searchParams);
  const params = loadInboxParams(searchParams);

  // Fetch inbox data (infinite query — wrap in try/catch, leave as fetchInfiniteQuery)
  let data: Awaited<ReturnType<typeof queryClient.fetchInfiniteQuery>> | null = null;
  try {
    data = await queryClient.fetchInfiniteQuery(
      trpc.inbox.get.infiniteQueryOptions({
        order: params.order,
        sort: params.sort,
        ...filter,
        tab: filter.tab ?? "all",
      }),
    );
  } catch (error) {
    console.error("[InboxPage] Failed to fetch inbox data:", error);
  }

  // Fetch accounts via direct caller
  let accounts: Awaited<ReturnType<Awaited<ReturnType<typeof getServerCaller>>["inboxAccounts"]["get"]>> | null = null;
  try {
    const caller = await getServerCaller();
    accounts = await caller.inboxAccounts.get();
    queryClient.setQueryData(
      trpc.inboxAccounts.get.queryOptions().queryKey,
      accounts,
    );
  } catch (error) {
    console.error("[InboxPage] Failed to fetch inbox accounts via direct caller:", error);
  }

  const hasInboxItems = (data?.pages?.[0]?.data?.length ?? 0) > 0;
  const hasConnectedAccounts = accounts && accounts.length > 0;
  // Exclude 'tab' from filter check since it's a navigation param, not a filter
  const hasFilter = Object.entries(filter).some(
    ([key, value]) => key !== "tab" && value !== null,
  );

  // No accounts and no items (and no filter) -> show get started
  if (!hasConnectedAccounts && !hasInboxItems && !hasFilter) {
    return <InboxGetStarted />;
  }

  // Accounts exist and have been synced, but no items (and no filter) -> show connected empty
  // Check if at least one account has been synced (has lastAccessed set)
  const hasSyncedAccounts = accounts?.some((a) => a.lastAccessed !== null);

  if (
    hasConnectedAccounts &&
    hasSyncedAccounts &&
    !hasInboxItems &&
    !hasFilter &&
    !params.connected
  ) {
    return (
      <Inbox>
        <InboxConnectedEmpty />
      </Inbox>
    );
  }

  return (
    <HydrateClient>
      <Inbox>
        <Suspense fallback={<InboxViewSkeleton />}>
          <InboxView />
        </Suspense>
      </Inbox>
    </HydrateClient>
  );
}
