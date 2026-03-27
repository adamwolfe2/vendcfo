"use client";

import { createClient } from "@vendcfo/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";
import { PAYMENT_METHOD_LABELS } from "./constants";
import type { EmployeeRow } from "./types";

// ---------------------------------------------------------------------------
// Record Payment Modal
// ---------------------------------------------------------------------------

export function RecordPaymentModal({
  employees,
  preselectedEmployeeId,
  teamId,
  onClose,
  onSaved,
}: {
  employees: EmployeeRow[];
  preselectedEmployeeId?: string;
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase: any = createClient();
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId ?? "");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ach");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0] ?? "",
  );
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState("completed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount) return;

    setSaving(true);
    setError(null);

    const payload = {
      business_id: teamId,
      employee_id: employeeId,
      amount: Number.parseFloat(amount),
      payment_method: paymentMethod,
      payment_date: paymentDate,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      notes: notes.trim() || null,
      status,
      reference_number: referenceNumber.trim() || null,
    };

    try {
      const { error: insertError } = await supabase
        .from("employee_payments")
        .insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Failed to record payment. Please try again.");
      setSaving(false);
    }
  };

  const activeEmployees = employees.filter((e) => e.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-lg rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">Record Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:text-[#333]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
            >
              <option value="">Select an employee...</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="mb-3 text-sm font-medium text-[#333]">
              Period Covered (optional)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-[#555]">
                  Period Start
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#555]">
                  Period End
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-12345"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional payment notes..."
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !employeeId || !amount}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
