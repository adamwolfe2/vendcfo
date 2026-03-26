"use client";

import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";
import { exportToCsv } from "@/utils/csv-export";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { CsvExportButton } from "./csv-export-button";

const INVOICE_COLUMNS = [
  { key: "invoice_number", header: "Invoice No." },
  { key: "status", header: "Status" },
  { key: "customer_name", header: "Customer" },
  { key: "amount", header: "Amount" },
  { key: "currency", header: "Currency" },
  { key: "issue_date", header: "Issue Date" },
  { key: "due_date", header: "Due Date" },
] as const;

export function ExportInvoicesCsv() {
  const trpc = useTRPC();
  const { filter } = useInvoiceFilterParams();
  const { params } = useSortParams();

  const { data } = useSuspenseInfiniteQuery(
    trpc.invoice.get.infiniteQueryOptions(
      {
        sort: params.sort,
        ...filter,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const handleExport = useCallback(() => {
    const rows = data?.pages.flatMap((page) => page?.data ?? []) ?? [];
    if (rows.length === 0) return;

    const exportRows = rows.map((row) => ({
      invoice_number: row.invoiceNumber ?? "",
      status: row.status ?? "",
      customer_name: row.customer?.name ?? row.customerName ?? "",
      amount: row.amount ?? 0,
      currency: row.currency ?? "",
      issue_date: row.issueDate ?? "",
      due_date: row.dueDate ?? "",
    }));

    exportToCsv(
      `invoices-${new Date().toISOString().slice(0, 10)}`,
      exportRows,
      [...INVOICE_COLUMNS],
    );
  }, [data]);

  return <CsvExportButton onClick={handleExport} />;
}
