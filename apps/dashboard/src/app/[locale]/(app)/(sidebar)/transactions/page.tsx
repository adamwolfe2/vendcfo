import { AddTransactions } from "@/components/add-transactions";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { TransactionsUploadZone } from "@/components/transactions-upload-zone";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | VendCFO",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Transactions(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadTransactionFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const { tab } = loadTransactionTab(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("transactions");

  // Build query filters for both tabs
  const allTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
  };

  const reviewTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
    fulfilled: true,
    exported: false,
    pageSize: 10000,
  };

  const queryClient = getQueryClient();

  // Prefetch all data needed for instant experience via direct caller
  try {
    const caller = await getServerCaller();

    const results = await Promise.allSettled([
      caller.transactions.getReviewCount(),
      caller.team.members(),
      caller.tags.get(),
      caller.apps.get(),
    ]);

    // Populate cache for regular queries
    if (results[0].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.transactions.getReviewCount.queryOptions().queryKey,
        results[0].value,
      );
    }
    if (results[1].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.team.members.queryOptions().queryKey,
        results[1].value,
      );
    }
    if (results[2].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.tags.get.queryOptions().queryKey,
        results[2].value,
      );
    }
    if (results[3].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.apps.get.queryOptions().queryKey,
        results[3].value,
      );
    }

    // Infinite queries — leave as prefetch with try/catch
    try {
      void queryClient.prefetchInfiniteQuery(
        trpc.transactions.get.infiniteQueryOptions(allTabFilter),
      );
    } catch (e) {
      console.error("[TransactionsPage] Failed to prefetch allTab:", e);
    }
    try {
      void queryClient.prefetchInfiniteQuery(
        trpc.transactions.get.infiniteQueryOptions(reviewTabFilter),
      );
    } catch (e) {
      console.error("[TransactionsPage] Failed to prefetch reviewTab:", e);
    }
  } catch (error) {
    console.error("[TransactionsPage] Failed to prefetch via direct caller:", error);
  }

  return (
    <HydrateClient>
      <ScrollableContent>
        <TransactionsUploadZone>
          <div className="flex justify-between items-center py-6">
            <TransactionsSearchFilter />
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <TransactionsColumnVisibility />
                <AddTransactions />
              </div>
              <TransactionTabs />
            </div>
          </div>

          <Suspense
            fallback={
              <Loading
                columnVisibility={initialSettings.columns}
                columnSizing={initialSettings.sizing}
                columnOrder={initialSettings.order}
              />
            }
          >
            <DataTable initialSettings={initialSettings} initialTab={tab} />
          </Suspense>
        </TransactionsUploadZone>
      </ScrollableContent>
    </HydrateClient>
  );
}
