"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueShareLineItem {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  sharePercentage: number;
  commissionAmount: number;
}

interface Props {
  lineItems: RevenueShareLineItem[];
  totalGrossRevenue: number;
  totalCommission: number;
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

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RevenueSharePreviewTable({
  lineItems,
  totalGrossRevenue,
  totalCommission,
  periodLabel,
}: Props) {
  if (lineItems.length === 0) {
    return (
      <div className="border border-[#e6e6e6] p-8 text-center">
        <p className="text-sm text-[#878787]">
          No locations with revenue share agreements found for {periodLabel}.
        </p>
        <p className="text-xs text-[#ccc] mt-1">
          Make sure locations have a rev share percentage configured.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e6e6e6] overflow-hidden">
      {/* Report header */}
      <div className="bg-[#1a1a1a] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">
          Revenue Share Report
        </h3>
        <p className="text-xs text-[#999] mt-0.5">{periodLabel}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9f9f9] border-b border-[#e6e6e6]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Location
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Gross Revenue
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Processing Fees
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Net Deposited
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Share %
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Commission
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr
                key={item.locationId}
                className="border-b border-[#f0f0f0] last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                  {item.locationName}
                </td>
                <td className="px-4 py-3 text-right text-[#1a1a1a] tabular-nums">
                  {fmt(item.grossRevenue)}
                </td>
                <td className="px-4 py-3 text-right text-[#991b1b] tabular-nums">
                  {item.processingFees > 0
                    ? `(${fmt(item.processingFees)})`
                    : fmt(0)}
                </td>
                <td className="px-4 py-3 text-right text-[#1a1a1a] tabular-nums">
                  {fmt(item.netDeposited)}
                </td>
                <td className="px-4 py-3 text-right text-[#666] tabular-nums">
                  {pct(item.sharePercentage)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a] tabular-nums">
                  {fmt(item.commissionAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f9f9f9] border-t border-[#e6e6e6]">
              <td className="px-4 py-3 font-semibold text-[#1a1a1a]">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a] tabular-nums">
                {fmt(totalGrossRevenue)}
              </td>
              <td className="px-4 py-3 text-right text-[#991b1b] tabular-nums">
                {fmt(
                  lineItems.reduce((s, i) => s + i.processingFees, 0),
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a] tabular-nums">
                {fmt(lineItems.reduce((s, i) => s + i.netDeposited, 0))}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-bold text-[#1a1a1a] tabular-nums">
                {fmt(totalCommission)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
