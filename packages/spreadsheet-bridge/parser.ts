import { z } from 'zod';

export const csvRowSchema = z.object({
  Date: z.string(),
  Description: z.string(),
  Amount: z.string(),
  'Expense Category': z.string().optional(),
  'Route Name': z.string().optional(),
  'Location Name': z.string().optional(),
  'Machine Serial': z.string().optional(),
});

export type VendingCsvRow = z.infer<typeof csvRowSchema>;

export function parseCsvRow(row: any): VendingCsvRow | null {
  const result = csvRowSchema.safeParse(row);
  if (result.success) {
    return result.data;
  }
  return null;
}
