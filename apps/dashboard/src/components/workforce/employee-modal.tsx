"use client";

import { createClient } from "@vendcfo/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";
import { EMPLOYMENT_TYPES } from "./constants";
import type { EmployeeRow } from "./types";

// ---------------------------------------------------------------------------
// Employee Modal (Add / Edit)
// ---------------------------------------------------------------------------

export function EmployeeModal({
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
  const supabase: any = createClient();
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
