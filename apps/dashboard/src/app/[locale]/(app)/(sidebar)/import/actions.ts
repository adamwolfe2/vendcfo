"use server";

import { parseCsvRow, VendingCsvRow, importVendingData } from '@vendcfo/spreadsheet-bridge';

export async function submitVendingData(formData: FormData) {
  const file = formData.get("csvFile") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const text = await file.text();
  const rows = text.split("\n");
  
  // Basic CSV parsing for mockup purposes
  const headers = rows[0]?.split(",").map(h => h.trim()) || [];
  const parsedRows: VendingCsvRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rawCols = rows[i]?.split(",").map(c => c.trim()) || [];
    if (rawCols.length === headers.length) {
      const obj: any = {};
      headers.forEach((h, j) => {
        obj[h] = rawCols[j];
      });
      
      const parsed = parseCsvRow(obj);
      if (parsed) {
        parsedRows.push(parsed);
      }
    }
  }

  const { importedCount, errorCount } = await importVendingData("mock-business-id", parsedRows);

  return { 
    success: true, 
    message: `Successfully imported ${importedCount} transactions. Failed: ${errorCount}`
  };
}
