"use client";

import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";
import { exportToCsv } from "@/utils/csv-export";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useCallback } from "react";
import { CsvExportButton } from "./csv-export-button";

const TRANSACTION_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "name", header: "Description" },
  { key: "amount", header: "Amount" },
  { key: "currency", header: "Currency" },
  { key: "category_name", header: "Category" },
  { key: "counterparty_name", header: "From / To" },
  { key: "bank_account_name", header: "Account" },
  { key: "method", header: "Method" },
  { key: "status", header: "Status" },
] as const;

export function ExportTransactionsCsv() {
  const trpc = useTRPC();
  const { filter, hasFilters } = useTransactionFilterParamsWithPersistence();
  const { params } = useSortParams();
  const deferredSearch = useDeferredValue(filter.q);

  const queryFilter = useMemo(
    () => ({
      ...filter,
      amountRange: filter.amount_range ?? null,
      q: deferredSearch,
      sort: params.sort,
      pageSize: hasFilters ? 10000 : undefined,
    }),
    [filter, deferredSearch, params.sort, hasFilters],
  );

  const { data } = useSuspenseInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions(queryFilter, {
      getNextPageParam: ({ meta }) => meta?.cursor,
    }),
  );

  const handleExport = useCallback(() => {
    const rows = data?.pages.flatMap((page) => page.data) ?? [];
    if (rows.length === 0) return;

    const exportRows = rows.map((row) => ({
      date: row.date ?? "",
      name: row.name ?? "",
      amount: row.amount ?? 0,
      currency: row.currency ?? "",
      category_name: row.category?.name ?? "",
      counterparty_name: row.counterpartyName ?? "",
      bank_account_name: row.account?.name ?? "",
      method: row.method ?? "",
      status: row.status ?? "",
    }));

    exportToCsv(
      `transactions-${new Date().toISOString().slice(0, 10)}`,
      exportRows,
      [...TRANSACTION_COLUMNS],
    );
  }, [data]);

  return <CsvExportButton onClick={handleExport} />;
}
