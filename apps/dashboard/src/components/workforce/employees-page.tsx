"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  Banknote,
  Briefcase,
  ChevronLeft,
  Clock,
  CreditCard,
  DollarSign,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeRow {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  employment_type: string;
  hire_date: string | null;
  is_active: boolean;
  bank_routing_number: string | null;
  bank_account_number: string | null;
  bank_account_type: string | null;
  created_at: string;
}

interface CompensationPlanRow {
  id: string;
  business_id: string;
  employee_id: string;
  name: string;
  pay_model: string;
  hourly_rate: string | number | null;
  per_machine_rate: string | number | null;
  per_stop_rate: string | number | null;
  revenue_share_pct: string | number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
}

interface PaymentRow {
  id: string;
  business_id: string;
  employee_id: string;
  amount: string | number;
  payment_method: string;
  payment_date: string;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  status: string;
  reference_number: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ach: "ACH",
  check: "Check",
  cash: "Cash",
  direct_deposit: "Direct Deposit",
};

const PAYMENT_STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]",
  },
  processing: {
    label: "Processing",
    className: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
  },
  completed: {
    label: "Completed",
    className: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  },
  failed: {
    label: "Failed",
    className: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
  },
};

const EMPLOYMENT_TYPES: Record<string, string> = {
  w2: "W-2",
  "1099": "1099",
  part_time: "Part-Time",
  seasonal: "Seasonal",
};

const PAY_MODEL_LABELS: Record<string, string> = {
  per_task: "Per Task",
  hourly: "Hourly",
  hybrid: "Hybrid",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  return Number.isNaN(n) ? 0 : n;
}

function fmtCurrency(val: number): string {
  return `$${val.toFixed(2)}`;
}

function maskValue(val: string | null): string {
  if (!val || val.length < 4) return "****";
  return `****${val.slice(-4)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Users size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No employees yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Add your first employee to start tracking compensation and payroll.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Employee
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Modal (Add / Edit)
// ---------------------------------------------------------------------------

function EmployeeModal({
  mode,
  entry,
  teamId,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: EmployeeRow | null;
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(entry?.name ?? "");
  const [email, setEmail] = useState(entry?.email ?? "");
  const [phone, setPhone] = useState(entry?.phone ?? "");
  const [role, setRole] = useState(entry?.role ?? "");
  const [employmentType, setEmploymentType] = useState(
    entry?.employment_type ?? "w2",
  );
  const [hireDate, setHireDate] = useState(entry?.hire_date ?? "");
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
  const [bankRouting, setBankRouting] = useState(
    entry?.bank_routing_number ?? "",
  );
  const [bankAccount, setBankAccount] = useState(
    entry?.bank_account_number ?? "",
  );
  const [bankAccountType, setBankAccountType] = useState(
    entry?.bank_account_type ?? "checking",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      business_id: teamId,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      role: role.trim() || null,
      employment_type: employmentType,
      hire_date: hireDate || null,
      is_active: isActive,
      bank_routing_number: bankRouting.trim() || null,
      bank_account_number: bankAccount.trim() || null,
      bank_account_type: bankAccountType,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("employees")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { business_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase
          .from("employees")
          .update(updatePayload)
          .eq("id", entry.id);
        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
      }
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-lg rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">
            {mode === "add" ? "Add Employee" : "Edit Employee"}
          </h2>
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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. John Smith"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Route Operator"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                {Object.entries(EMPLOYMENT_TYPES).map(([val, label]) => (
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
                Hire Date
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? "bg-[#111]" : "bg-[#d0d0d0]"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${isActive ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
                <span className="text-sm text-[#555]">Active</span>
              </div>
            </div>
          </div>

          {/* ACH Section */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="mb-3 text-sm font-medium text-[#333]">
              ACH Payment Info
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-[#555]">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={bankRouting}
                  onChange={(e) => setBankRouting(e.target.value)}
                  placeholder="021000021"
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#555]">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="123456789"
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-[#555]">
                Account Type
              </label>
              <select
                value={bankAccountType}
                onChange={(e) => setBankAccountType(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
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
              disabled={saving || !name.trim()}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Add Employee"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compensation Plan Modal
// ---------------------------------------------------------------------------

function CompensationModal({
  employeeId,
  teamId,
  entry,
  onClose,
  onSaved,
}: {
  employeeId: string;
  teamId: string;
  entry?: CompensationPlanRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const mode = entry ? "edit" : "add";
  const [planName, setPlanName] = useState(entry?.name ?? "");
  const [payModel, setPayModel] = useState(entry?.pay_model ?? "hourly");
  const [hourlyRate, setHourlyRate] = useState(
    String(toNum(entry?.hourly_rate) || ""),
  );
  const [perMachineRate, setPerMachineRate] = useState(
    String(toNum(entry?.per_machine_rate) || ""),
  );
  const [perStopRate, setPerStopRate] = useState(
    String(toNum(entry?.per_stop_rate) || ""),
  );
  const [revenueSharePct, setRevenueSharePct] = useState(
    String(toNum(entry?.revenue_share_pct) || ""),
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    entry?.effective_from ?? new Date().toISOString().split("T")[0] ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      business_id: teamId,
      employee_id: employeeId,
      name: planName.trim(),
      pay_model: payModel,
      hourly_rate:
        payModel === "hourly" || payModel === "hybrid"
          ? Number.parseFloat(hourlyRate) || null
          : null,
      per_machine_rate:
        payModel === "per_task"
          ? Number.parseFloat(perMachineRate) || null
          : null,
      per_stop_rate:
        payModel === "per_task"
          ? Number.parseFloat(perStopRate) || null
          : null,
      revenue_share_pct:
        payModel === "hybrid"
          ? Number.parseFloat(revenueSharePct) || null
          : null,
      effective_from: effectiveFrom,
      is_active: true,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("compensation_plans")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { business_id, employee_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase
          .from("compensation_plans")
          .update(updatePayload)
          .eq("id", entry.id);
        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
      }
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-md rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">
            {mode === "add" ? "Add Compensation Plan" : "Edit Compensation Plan"}
          </h2>
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
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
              placeholder="e.g. Standard Hourly"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Pay Model
            </label>
            <select
              value={payModel}
              onChange={(e) => setPayModel(e.target.value)}
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
            >
              {Object.entries(PAY_MODEL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(payModel === "hourly" || payModel === "hybrid") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="25.00"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          )}

          {payModel === "per_task" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#333]">
                  Per Machine ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={perMachineRate}
                  onChange={(e) => setPerMachineRate(e.target.value)}
                  placeholder="5.00"
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#333]">
                  Per Stop ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={perStopRate}
                  onChange={(e) => setPerStopRate(e.target.value)}
                  placeholder="15.00"
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
                />
              </div>
            </div>
          )}

          {payModel === "hybrid" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Revenue Share (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={revenueSharePct}
                onChange={(e) => setRevenueSharePct(e.target.value)}
                placeholder="10.00"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Effective From
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
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
              disabled={saving || !planName.trim()}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Add Plan"
                  : "Save Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  label,
  onConfirm,
  onCancel,
  deleting,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative mx-4 w-full max-w-sm rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#111]">
          Delete {label}
        </h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this {label.toLowerCase()}? This
          action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Record Payment Modal
// ---------------------------------------------------------------------------

function RecordPaymentModal({
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
  const supabase = createClient();
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

// ---------------------------------------------------------------------------
// Payment History Table
// ---------------------------------------------------------------------------

function PaymentHistorySection({
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

// ---------------------------------------------------------------------------
// Employee Payment History (for detail view)
// ---------------------------------------------------------------------------

function EmployeePaymentHistory({
  employeeId,
  teamId,
  onRecordPayment,
}: {
  employeeId: string;
  teamId: string;
  onRecordPayment: () => void;
}) {
  const supabase = createClient();
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

// ---------------------------------------------------------------------------
// Employee Detail View
// ---------------------------------------------------------------------------

function EmployeeDetail({
  employee,
  teamId,
  onBack,
  onEdit,
  onRefresh,
}: {
  employee: EmployeeRow;
  teamId: string;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [plans, setPlans] = useState<CompensationPlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editPlan, setEditPlan] = useState<CompensationPlanRow | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    const { data } = await supabase
      .from("compensation_plans")
      .select("*")
      .eq("employee_id", employee.id)
      .order("is_active", { ascending: false })
      .order("effective_from", { ascending: false });
    if (data) setPlans(data as CompensationPlanRow[]);
    setLoadingPlans(false);
  }, [supabase, employee.id]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;
    setDeletingPlan(true);
    const { error } = await supabase
      .from("compensation_plans")
      .delete()
      .eq("id", deletePlanId);
    if (!error) {
      setPlans((prev) => prev.filter((p) => p.id !== deletePlanId));
    }
    setDeletePlanId(null);
    setDeletingPlan(false);
  };

  const activePlan = plans.find((p) => p.is_active);

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 min-h-[44px] text-sm text-[#666] transition-colors hover:text-[#111]"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Back to Employees
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-[#666]">
            <User size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111]">{employee.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {employee.role && (
                <span className="text-sm text-[#666]">{employee.role}</span>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  employee.is_active
                    ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                    : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                }`}
              >
                {employee.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d0d0] bg-white px-3 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
        >
          <Pencil size={14} strokeWidth={1.5} />
          Edit
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            Basic Info
          </h3>
          <div className="space-y-2.5">
            {employee.email && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Mail size={14} strokeWidth={1.5} className="text-[#999]" />
                {employee.email}
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Phone size={14} strokeWidth={1.5} className="text-[#999]" />
                {employee.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <Briefcase size={14} strokeWidth={1.5} className="text-[#999]" />
              {EMPLOYMENT_TYPES[employee.employment_type] ??
                employee.employment_type}
            </div>
            {employee.hire_date && (
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Clock size={14} strokeWidth={1.5} className="text-[#999]" />
                Hired {formatDate(employee.hire_date)}
              </div>
            )}
          </div>
        </div>

        {/* Active Compensation Plan */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            Active Pay Model
          </h3>
          {loadingPlans ? (
            <div className="h-16 animate-pulse rounded bg-[#f5f5f5]" />
          ) : activePlan ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                  {PAY_MODEL_LABELS[activePlan.pay_model] ??
                    activePlan.pay_model}
                </span>
                <span className="text-xs text-[#999]">{activePlan.name}</span>
              </div>
              {(activePlan.pay_model === "hourly" ||
                activePlan.pay_model === "hybrid") && (
                <div className="flex items-center gap-2 text-sm text-[#555]">
                  <DollarSign
                    size={14}
                    strokeWidth={1.5}
                    className="text-[#999]"
                  />
                  {fmtCurrency(toNum(activePlan.hourly_rate))}/hr
                </div>
              )}
              {activePlan.pay_model === "per_task" && (
                <>
                  <div className="text-sm text-[#555]">
                    {fmtCurrency(toNum(activePlan.per_machine_rate))}/machine
                  </div>
                  <div className="text-sm text-[#555]">
                    {fmtCurrency(toNum(activePlan.per_stop_rate))}/stop
                  </div>
                </>
              )}
              {activePlan.pay_model === "hybrid" &&
                toNum(activePlan.revenue_share_pct) > 0 && (
                  <div className="text-sm text-[#555]">
                    +{toNum(activePlan.revenue_share_pct)}% revenue share
                  </div>
                )}
            </div>
          ) : (
            <p className="text-sm text-[#999]">No active compensation plan</p>
          )}
        </div>

        {/* ACH Info */}
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#111] mb-3">
            ACH Payment
          </h3>
          {employee.bank_routing_number || employee.bank_account_number ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Banknote
                  size={14}
                  strokeWidth={1.5}
                  className="text-[#999]"
                />
                Routing: {maskValue(employee.bank_routing_number)}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <Banknote
                  size={14}
                  strokeWidth={1.5}
                  className="text-[#999]"
                />
                Account: {maskValue(employee.bank_account_number)}
              </div>
              <div className="text-xs text-[#999] capitalize">
                {employee.bank_account_type ?? "checking"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#999]">No bank info on file</p>
          )}
        </div>
      </div>

      {/* Compensation Plans table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111]">
            Compensation Plans
          </h3>
          <button
            type="button"
            onClick={() => setShowAddPlan(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3 py-1.5 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Plan
          </button>
        </div>

        {loadingPlans ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-8 text-center">
            <DollarSign
              size={24}
              strokeWidth={1.5}
              className="mx-auto mb-2 text-[#bbb]"
            />
            <p className="text-sm text-[#666]">
              No compensation plans yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Pay Model
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[#555]">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Effective
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[#555]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[#555]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[#111]">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                        {PAY_MODEL_LABELS[plan.pay_model] ?? plan.pay_model}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#555]">
                      {plan.pay_model === "hourly" &&
                        `${fmtCurrency(toNum(plan.hourly_rate))}/hr`}
                      {plan.pay_model === "per_task" &&
                        `${fmtCurrency(toNum(plan.per_stop_rate))}/stop`}
                      {plan.pay_model === "hybrid" &&
                        `${fmtCurrency(toNum(plan.hourly_rate))}/hr + ${toNum(plan.revenue_share_pct)}%`}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {formatDate(plan.effective_from)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          plan.is_active
                            ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                            : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditPlan(plan)}
                          title="Edit"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                        >
                          <Pencil size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePlanId(plan.id)}
                          title="Delete"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="mb-6" key={paymentRefreshKey}>
        <EmployeePaymentHistory
          employeeId={employee.id}
          teamId={teamId}
          onRecordPayment={() => setShowRecordPayment(true)}
        />
      </div>

      {/* Modals */}
      {showAddPlan && (
        <CompensationModal
          employeeId={employee.id}
          teamId={teamId}
          onClose={() => setShowAddPlan(false)}
          onSaved={fetchPlans}
        />
      )}
      {editPlan && (
        <CompensationModal
          employeeId={employee.id}
          teamId={teamId}
          entry={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={fetchPlans}
        />
      )}
      {deletePlanId && (
        <DeleteConfirmModal
          label="Plan"
          onConfirm={handleDeletePlan}
          onCancel={() => setDeletePlanId(null)}
          deleting={deletingPlan}
        />
      )}
      {showRecordPayment && (
        <RecordPaymentModal
          employees={[employee]}
          preselectedEmployeeId={employee.id}
          teamId={teamId}
          onClose={() => setShowRecordPayment(false)}
          onSaved={() => setPaymentRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compensation Summary Card
// ---------------------------------------------------------------------------

function CompensationSummary({
  employees,
  plans,
}: {
  employees: EmployeeRow[];
  plans: CompensationPlanRow[];
}) {
  const activeEmployees = employees.filter((e) => e.is_active);
  const activePlans = plans.filter((p) => p.is_active);

  // Build lookup: employeeId -> active plan
  const planByEmployee: Record<string, CompensationPlanRow> = {};
  for (const plan of activePlans) {
    planByEmployee[plan.employee_id] = plan;
  }

  // Pay model distribution
  const modelCounts: Record<string, number> = {
    hourly: 0,
    per_task: 0,
    hybrid: 0,
  };
  for (const plan of activePlans) {
    const key = plan.pay_model;
    modelCounts[key] = (modelCounts[key] ?? 0) + 1;
  }

  // Estimate weekly cost (40hrs for hourly/hybrid, rough estimate for per_task)
  const HOURS_PER_WEEK = 40;
  let totalWeeklyCost = 0;
  const breakdown: { name: string; weeklyCost: number; model: string }[] = [];

  for (const emp of activeEmployees) {
    const plan = planByEmployee[emp.id];
    if (!plan) {
      breakdown.push({ name: emp.name, weeklyCost: 0, model: "none" });
      continue;
    }

    let cost = 0;
    if (plan.pay_model === "hourly") {
      cost = toNum(plan.hourly_rate) * HOURS_PER_WEEK;
    } else if (plan.pay_model === "hybrid") {
      cost = toNum(plan.hourly_rate) * HOURS_PER_WEEK;
    } else if (plan.pay_model === "per_task") {
      // Rough estimate: 20 stops/week, 3 machines/stop avg
      cost =
        toNum(plan.per_stop_rate) * 20 + toNum(plan.per_machine_rate) * 60;
    }

    totalWeeklyCost += cost;
    breakdown.push({
      name: emp.name,
      weeklyCost: cost,
      model: plan.pay_model,
    });
  }

  if (activeEmployees.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-white p-5 mb-6">
      <h3 className="text-sm font-semibold text-[#111] mb-4">
        Compensation Summary
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Total weekly estimate */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Est. Weekly Labor Cost</p>
          <p className="text-lg font-bold text-[#111]">
            {fmtCurrency(totalWeeklyCost)}
          </p>
        </div>

        {/* Active employees */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Active Employees</p>
          <p className="text-lg font-bold text-[#111]">
            {activeEmployees.length}
          </p>
        </div>

        {/* Model distribution */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Pay Models</p>
          <div className="flex items-center gap-2 mt-1">
            {Object.entries(modelCounts)
              .filter(([, count]) => count > 0)
              .map(([model, count]) => (
                <span
                  key={model}
                  className="inline-flex items-center rounded-full border border-[#ddd] bg-white px-2 py-0.5 text-xs font-medium text-[#555]"
                >
                  {PAY_MODEL_LABELS[model] ?? model}: {count}
                </span>
              ))}
            {Object.values(modelCounts).every((c) => c === 0) && (
              <span className="text-sm text-[#999]">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Per-employee breakdown */}
      {breakdown.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="pb-2 text-left font-medium text-[#555]">
                  Employee
                </th>
                <th className="pb-2 text-left font-medium text-[#555]">
                  Model
                </th>
                <th className="pb-2 text-right font-medium text-[#555]">
                  Est. Weekly
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-[#f0f0f0] last:border-0"
                >
                  <td className="py-2 text-[#111]">{row.name}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#555]">
                      {row.model === "none"
                        ? "No plan"
                        : (PAY_MODEL_LABELS[row.model] ?? row.model)}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-[#555]">
                    {row.weeklyCost > 0 ? fmtCurrency(row.weeklyCost) : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmployeesPage({
  initialData,
  initialPlans,
  teamId,
}: {
  initialData: EmployeeRow[];
  initialPlans: CompensationPlanRow[];
  teamId: string;
}) {
  const supabase = createClient();
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialData);
  const [allPlans, setAllPlans] = useState<CompensationPlanRow[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<EmployeeRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"employees" | "payments">(
    "employees",
  );
  const [allPayments, setAllPayments] = useState<PaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const [empRes, planRes] = await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("business_id", teamId)
        .order("name", { ascending: true }),
      supabase
        .from("compensation_plans")
        .select("*")
        .eq("business_id", teamId)
        .order("effective_from", { ascending: false }),
    ]);
    if (empRes.data) setEmployees(empRes.data as EmployeeRow[]);
    if (planRes.data) setAllPlans(planRes.data as CompensationPlanRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    const { data } = await supabase
      .from("employee_payments")
      .select("*")
      .eq("business_id", teamId)
      .order("payment_date", { ascending: false })
      .limit(50);
    if (data) setAllPayments(data as PaymentRow[]);
    setLoadingPayments(false);
  }, [supabase, teamId]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [activeTab, fetchPayments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", deleteId);
    if (!error) {
      setEmployees((prev) => prev.filter((e) => e.id !== deleteId));
      setAllPlans((prev) => prev.filter((p) => p.employee_id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  // Build a lookup for active plan per employee (for the list view)
  const activePlanByEmployee: Record<string, CompensationPlanRow> = {};
  for (const plan of allPlans) {
    if (plan.is_active) {
      activePlanByEmployee[plan.employee_id] = plan;
    }
  }

  // If viewing a specific employee detail
  if (selectedEmployee) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
        <EmployeeDetail
          employee={selectedEmployee}
          teamId={teamId}
          onBack={() => {
            setSelectedEmployee(null);
            fetchEmployees();
          }}
          onEdit={() => setEditEntry(selectedEmployee)}
          onRefresh={fetchEmployees}
        />

        {editEntry && (
          <EmployeeModal
            mode="edit"
            entry={editEntry}
            teamId={teamId}
            onClose={() => setEditEntry(null)}
            onSaved={() => {
              fetchEmployees().then(() => {
                // Refresh the selected employee with latest data
                const updated = employees.find(
                  (e) => e.id === selectedEmployee.id,
                );
                if (updated) setSelectedEmployee(updated);
              });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your workforce, compensation plans, and payment info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "payments" && (
            <button
              type="button"
              onClick={() => setShowRecordPaymentModal(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={1.5} />
              Record Payment
            </button>
          )}
          {activeTab === "employees" && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={1.5} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[#e0e0e0]">
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "employees"
              ? "border-[#111] text-[#111]"
              : "border-transparent text-[#999] hover:text-[#666]"
          }`}
        >
          <Users size={16} strokeWidth={1.5} />
          Employees
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "payments"
              ? "border-[#111] text-[#111]"
              : "border-transparent text-[#999] hover:text-[#666]"
          }`}
        >
          <CreditCard size={16} strokeWidth={1.5} />
          Payments
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <>
          {/* Compensation Summary */}
          {!loading && employees.length > 0 && (
            <CompensationSummary employees={employees} plans={allPlans} />
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
                />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Role
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#555]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#555]">
                      Hire Date
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#555]">
                      Pay Model
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#555]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#555]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const plan = activePlanByEmployee[emp.id];
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#666]">
                              <User size={16} strokeWidth={1.5} />
                            </div>
                            <div>
                              <span className="font-semibold text-[#111]">
                                {emp.name}
                              </span>
                              {emp.email && (
                                <p className="text-xs text-[#999]">
                                  {emp.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {emp.role || "--"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                            {EMPLOYMENT_TYPES[emp.employment_type] ??
                              emp.employment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {formatDate(emp.hire_date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {plan ? (
                            <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#555]">
                              {PAY_MODEL_LABELS[plan.pay_model] ??
                                plan.pay_model}
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              emp.is_active
                                ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                                : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                            }`}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setEditEntry(emp)}
                              title="Edit"
                              className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                            >
                              <Pencil size={16} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(emp.id)}
                              title="Delete"
                              className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && employees.length > 0 && (
            <p className="mt-4 text-xs text-[#999]">
              {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <PaymentHistorySection
          payments={allPayments}
          employees={employees}
          loading={loadingPayments}
          onRecordPayment={() => setShowRecordPaymentModal(true)}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <EmployeeModal
          mode="add"
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchEmployees}
        />
      )}
      {editEntry && !selectedEmployee && (
        <EmployeeModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchEmployees}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          label="Employee"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          deleting={deleting}
        />
      )}
      {showRecordPaymentModal && (
        <RecordPaymentModal
          employees={employees}
          teamId={teamId}
          onClose={() => setShowRecordPaymentModal(false)}
          onSaved={() => {
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
