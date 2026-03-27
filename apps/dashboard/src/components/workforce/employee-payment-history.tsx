"use client";

import { createClient } from "@vendcfo/supabase/client";
import { CreditCard, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_STYLES } from "./constants";
import { fmtCurrency, formatDate, toNum } from "./helpers";
import type { PaymentRow } from "./types";

// ---------------------------------------------------------------------------
// Employee Payment History (for detail view)
// ---------------------------------------------------------------------------

export function EmployeePaymentHistory({
  employeeId,
  teamId,
  onRecordPayment,
}: {
  employeeId: string;
  teamId: string;
  onRecordPayment: () => void;
}) {
  const supabase: any = createClient();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("employee_payments")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("business_id", teamId)
      .order("payment_date", { ascending: false });
    if (data) setPayments(data as PaymentRow[]);
    setLoading(false);
  }, [supabase, employeeId, teamId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + toNum(p.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#111]">
            Payment History
          </h3>
          {totalPaid > 0 && (
            <span className="text-xs text-[#999]">
              Total paid: {fmtCurrency(totalPaid)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRecordPayment}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3 py-1.5 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
        >
          <Plus size={14} strokeWidth={1.5} />
          Record Payment
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
            />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-8 text-center">
          <CreditCard
            size={24}
            strokeWidth={1.5}
            className="mx-auto mb-2 text-[#bbb]"
          />
          <p className="text-sm text-[#666]">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Date
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
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Period
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const statusStyle = PAYMENT_STATUS_STYLES[payment.status] ?? {
                  label: payment.status,
                  className:
                    "bg-[#f3f4f6] text-[#374151] border-[#d1d5db]",
                };
                const periodStr =
                  payment.period_start && payment.period_end
                    ? `${formatDate(payment.period_start)} - ${formatDate(payment.period_end)}`
                    : "--";
                return (
                  <tr
                    key={payment.id}
                    className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                  >
                    <td className="px-4 py-3 text-[#111]">
                      {formatDate(payment.payment_date)}
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
                    <td className="px-4 py-3 text-xs text-[#666]">
                      {periodStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
