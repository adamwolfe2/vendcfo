"use client";

import { CreditCard, Plus } from "lucide-react";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_STYLES } from "./constants";
import { fmtCurrency, formatDate, toNum } from "./helpers";
import type { EmployeeRow, PaymentRow } from "./types";

// ---------------------------------------------------------------------------
// Payment History Table
// ---------------------------------------------------------------------------

export function PaymentHistorySection({
  payments,
  employees,
  loading,
  onRecordPayment,
}: {
  payments: PaymentRow[];
  employees: EmployeeRow[];
  loading: boolean;
  onRecordPayment: () => void;
}) {
  const employeeLookup: Record<string, string> = {};
  for (const emp of employees) {
    employeeLookup[emp.id] = emp.name;
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
          />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-12 text-center">
        <CreditCard
          size={32}
          strokeWidth={1.5}
          className="mx-auto mb-3 text-[#bbb]"
        />
        <p className="text-sm font-medium text-[#555]">No payments recorded</p>
        <p className="mt-1 text-xs text-[#999]">
          Record a payment to start tracking compensation disbursements.
        </p>
        <button
          type="button"
          onClick={onRecordPayment}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
        >
          <Plus size={16} strokeWidth={1.5} />
          Record Payment
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
            <th className="px-4 py-3 text-left font-medium text-[#555]">
              Date
            </th>
            <th className="px-4 py-3 text-left font-medium text-[#555]">
              Employee
            </th>
            <th className="px-4 py-3 text-right font-medium text-[#555]">
              Amount
            </th>
            <th className="px-4 py-3 text-center font-medium text-[#555]">
              Method
            </th>
            <th className="px-4 py-3 text-center font-medium text-[#555]">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-[#555]">
              Reference
            </th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const statusStyle = PAYMENT_STATUS_STYLES[payment.status] ?? {
              label: payment.status,
              className: "bg-[#f3f4f6] text-[#374151] border-[#d1d5db]",
            };
            return (
              <tr
                key={payment.id}
                className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
              >
                <td className="px-4 py-3 text-[#111]">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-4 py-3 font-medium text-[#111]">
                  {employeeLookup[payment.employee_id] ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#111]">
                  {fmtCurrency(toNum(payment.amount))}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                    {PAYMENT_METHOD_LABELS[payment.payment_method] ??
                      payment.payment_method}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle.className}`}
                  >
                    {statusStyle.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#666] font-mono text-xs">
                  {payment.reference_number ?? "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
