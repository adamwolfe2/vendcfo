"use client";

import { createClient } from "@vendcfo/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";
import type { SupplierRow } from "./types";

interface SupplierModalProps {
  mode: "add" | "edit";
  entry?: SupplierRow | null;
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SupplierModal({
  mode,
  entry,
  teamId,
  onClose,
  onSaved,
}: SupplierModalProps) {
  const supabase: any = createClient();
  const [name, setName] = useState(entry?.name ?? "");
  const [contactName, setContactName] = useState(entry?.contact_name ?? "");
  const [email, setEmail] = useState(entry?.email ?? "");
  const [phone, setPhone] = useState(entry?.phone ?? "");
  const [leadTimeDays, setLeadTimeDays] = useState(
    String(entry?.lead_time_days ?? "3"),
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    String(entry?.minimum_order_amount ?? "0"),
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
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
      contact_name: contactName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      lead_time_days: Number.parseInt(leadTimeDays, 10) || 3,
      minimum_order_amount: Number.parseFloat(minOrderAmount) || 0,
      notes: notes.trim() || null,
      is_active: isActive,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("suppliers")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { business_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase
          .from("suppliers")
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
            {mode === "add" ? "Add Supplier" : "Edit Supplier"}
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
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Vistar Corporation"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Smith"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@supplier.com"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Lead Time (days)
              </label>
              <input
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Min Order ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Delivery instructions, account number, etc."
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[#d0d0d0]"
            />
            <label htmlFor="is-active" className="text-sm text-[#333]">
              Active supplier
            </label>
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
                  ? "Add Supplier"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
