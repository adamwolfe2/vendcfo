import { Suspense } from "react";
import { CustomersColumnVisibility } from "./customers-column-visibility";
import { ExportCustomersCsv } from "./export-customers-csv";
import { OpenCustomerSheet } from "./open-customer-sheet";
import { SearchField } from "./search-field";

export async function CustomersHeader() {
  return (
    <div className="flex items-center justify-between">
      <SearchField placeholder="Search customers" />

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <Suspense fallback={null}>
            <ExportCustomersCsv />
          </Suspense>
          <CustomersColumnVisibility />
        </div>
        <OpenCustomerSheet />
      </div>
    </div>
  );
}
