"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesTaxLineItem {
  jurisdiction: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

interface Props {
  lineItems: SalesTaxLineItem[];
  totalTaxableAmount: number;
  totalTaxAmount: number;
  periodLabel: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function pctRate(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SalesTaxPreviewTable({
  lineItems,
  totalTaxableAmount,
  totalTaxAmount,
  periodLabel,
}: Props) {
  if (lineItems.length === 0) {
    return (
      <div className="border border-[#e6e6e6] p-8 text-center">
        <p className="text-sm text-[#878787]">
          No sales tax records found for {periodLabel}.
        </p>
        <p className="text-xs text-[#ccc] mt-1">
          Import or add sales tax records to generate this report.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e6e6e6] overflow-hidden">
      {/* Report header */}
      <div className="bg-[#1a1a1a] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">
          Sales Tax Filing Summary
        </h3>
        <p className="text-xs text-[#999] mt-0.5">{periodLabel}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9f9f9] border-b border-[#e6e6e6]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Jurisdiction
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Tax Rate
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Taxable Amount
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Tax Collected
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr
                key={item.jurisdiction}
                className="border-b border-[#f0f0f0] last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                  {item.jurisdiction}
                </td>
                <td className="px-4 py-3 text-right text-[#666] tabular-nums">
                  {pctRate(item.taxRate)}
                </td>
                <td className="px-4 py-3 text-right text-[#1a1a1a] tabular-nums">
                  {fmt(item.taxableAmount)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a] tabular-nums">
                  {fmt(item.taxAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f9f9f9] border-t border-[#e6e6e6]">
              <td className="px-4 py-3 font-semibold text-[#1a1a1a]">Total</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a] tabular-nums">
                {fmt(totalTaxableAmount)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#1a1a1a] tabular-nums">
                {fmt(totalTaxAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
