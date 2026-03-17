import { VendingCsvRow } from './parser';
import { insertTransactions } from './mock-db/db';

export async function importVendingData(businessId: string, rows: VendingCsvRow[]) {
  let importedCount = 0;
  let errorCount = 0;
  const validRows: VendingCsvRow[] = [];

  for (const row of rows) {
    const amount = parseFloat(row.Amount);
    if (!isNaN(amount) && row.Date) {
      validRows.push(row);
      importedCount++;
    } else {
      errorCount++;
    }
  }

  if (validRows.length > 0) {
    insertTransactions(validRows);
  }

  return { importedCount, errorCount };
}
