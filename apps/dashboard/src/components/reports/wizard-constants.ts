import type { ReportType } from "./wizard-types";

export const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "rev_share",
    label: "Revenue Share / Commission",
    description:
      "Calculate revenue share owed to property managers based on location performance.",
  },
  {
    value: "sales_tax",
    label: "Sales Tax",
    description:
      "Summarize taxable amounts and tax collected by jurisdiction for quarterly filing.",
  },
  {
    value: "profitability",
    label: "Profitability",
    description:
      "Analyze profitability at the route or business level for the period.",
  },
  {
    value: "employee_productivity",
    label: "Employee Productivity",
    description:
      "Review employee hours, stops, and efficiency metrics for the quarter.",
  },
];

export function getPreviousQuarter(): { start: string; end: string; label: string } {
  const now = new Date();
  let quarter = Math.floor(now.getMonth() / 3) - 1;
  let year = now.getFullYear();
  if (quarter < 0) {
    quarter = 3;
    year -= 1;
  }
  const startMonth = quarter * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `Q${quarter + 1} ${year}`,
  };
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}
