export const csvTemplateHeaders = [
  'Date',
  'Description',
  'Amount',
  'Expense Category',
  'Route Name',
  'Location Name',
  'Machine Serial'
];

export const csvTemplateExample = [
  ['2026-03-01', 'Vistar Restock', '-450.00', 'COGS', 'Downtown Route', 'Office Tower A', 'SN12345'],
  ['2026-03-05', 'Location Commission', '-45.00', 'Rev Share', 'Downtown Route', 'Office Tower A', 'SN12345'],
  ['2026-03-07', 'Card Sales Settlement', '350.50', 'Revenue', 'Downtown Route', 'Office Tower A', 'SN12345'],
  ['2026-03-10', 'Fuel', '-65.00', 'Fuel', 'Downtown Route', '', ''],
];

export function generateTemplateString(): string {
  const headers = csvTemplateHeaders.join(',');
  const rows = csvTemplateExample.map(row => row.join(',')).join('\n');
  return `${headers}\n${rows}`;
}
