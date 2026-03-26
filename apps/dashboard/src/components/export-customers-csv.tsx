"use client";

import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";
import { exportToCsv } from "@/utils/csv-export";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useCallback } from "react";
import { CsvExportButton } from "./csv-export-button";

const CUSTOMER_COLUMNS = [
  { key: "name", header: "Name" },
  { key: "contact", header: "Contact" },
  { key: "email", header: "Email" },
  { key: "country", header: "Country" },
  { key: "industry", header: "Industry" },
  { key: "website", header: "Website" },
] as const;

export function ExportCustomersCsv() {
  const trpc = useTRPC();
  const { filter } = useCustomerFilterParams();
  const { params } = useSortParams();
  const deferredSearch = useDeferredValue(filter.q);

  const { data } = useSuspenseInfiniteQuery(
    trpc.customers.get.infiniteQueryOptions(
      {
        ...filter,
        sort: params.sort,
        q: deferredSearch,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const handleExport = useCallback(() => {
    const rows = data?.pages.flatMap((page) => page.data) ?? [];
    if (rows.length === 0) return;

    const exportRows = rows.map((row) => ({
      name: row.name ?? "",
      contact: row.contact ?? "",
      email: row.email ?? "",
      country: row.country ?? "",
      industry: row.industry ?? "",
      website: row.website ?? "",
    }));

    exportToCsv(
      `customers-${new Date().toISOString().slice(0, 10)}`,
      exportRows,
      [...CUSTOMER_COLUMNS],
    );
  }, [data]);

  return <CsvExportButton onClick={handleExport} />;
}
