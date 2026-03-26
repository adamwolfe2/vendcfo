import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { Suspense } from "react";
import { ExportInvoicesCsv } from "./export-invoices-csv";
import { InvoiceColumnVisibility } from "./invoice-column-visibility";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div className="hidden sm:flex items-center space-x-2">
        <Suspense fallback={null}>
          <ExportInvoicesCsv />
        </Suspense>
        <InvoiceColumnVisibility />
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
