import { CollapsibleSummary } from "@/components/collapsible-summary";
import { ErrorFallback } from "@/components/error-fallback";
import { InvoiceHeader } from "@/components/invoice-header";
import {
  InvoicePaymentScore,
  InvoicePaymentScoreSkeleton,
} from "@/components/invoice-payment-score";
import { InvoiceSummarySkeleton } from "@/components/invoice-summary";
import { InvoicesOpen } from "@/components/invoices-open";
import { InvoicesOverdue } from "@/components/invoices-overdue";
import { InvoicesPaid } from "@/components/invoices-paid";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/invoices/data-table";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import { loadInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Invoices | VendCFO",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadInvoiceFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("invoices");

  const queryClient = getQueryClient();

  try {
    const caller = await getServerCaller();

    // Fetch regular queries via direct caller
    const results = await Promise.allSettled([
      caller.invoice.invoiceSummary({ statuses: ["draft", "scheduled", "unpaid"] }),
      caller.invoice.invoiceSummary({ statuses: ["paid"] }),
      caller.invoice.invoiceSummary({ statuses: ["overdue"] }),
      caller.invoice.paymentStatus(),
    ]);

    if (results[0].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.invoice.invoiceSummary.queryOptions({ statuses: ["draft", "scheduled", "unpaid"] }).queryKey,
        results[0].value,
      );
    }
    if (results[1].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.invoice.invoiceSummary.queryOptions({ statuses: ["paid"] }).queryKey,
        results[1].value,
      );
    }
    if (results[2].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.invoice.invoiceSummary.queryOptions({ statuses: ["overdue"] }).queryKey,
        results[2].value,
      );
    }
    if (results[3].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.invoice.paymentStatus.queryOptions().queryKey,
        results[3].value,
      );
    }

    // Infinite query — leave as prefetch with try/catch
    try {
      void queryClient.prefetchInfiniteQuery(
        trpc.invoice.get.infiniteQueryOptions({ ...filter, sort }),
      );
    } catch (e) {
      console.error("[InvoicesPage] Failed to prefetch invoice list:", e);
    }
  } catch (error) {
    console.error("[InvoicesPage] Failed to prefetch via direct caller:", error);
  }

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <CollapsibleSummary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
              <Suspense fallback={<InvoiceSummarySkeleton />}>
                <InvoicesOpen />
              </Suspense>
              <Suspense fallback={<InvoiceSummarySkeleton />}>
                <InvoicesOverdue />
              </Suspense>
              <Suspense fallback={<InvoiceSummarySkeleton />}>
                <InvoicesPaid />
              </Suspense>
              <Suspense fallback={<InvoicePaymentScoreSkeleton />}>
                <InvoicePaymentScore />
              </Suspense>
            </div>
          </CollapsibleSummary>

          <InvoiceHeader />

          <ErrorBoundary errorComponent={ErrorFallback}>
            <Suspense fallback={<InvoiceSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
