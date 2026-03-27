"use client";

import { createClient } from "@vendcfo/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";
import { PAY_MODEL_LABELS } from "./constants";
import { toNum } from "./helpers";
import type { CompensationPlanRow } from "./types";

// ---------------------------------------------------------------------------
// Compensation Plan Modal
// ---------------------------------------------------------------------------

export function CompensationModal({
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
  const supabase: any = createClient();
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
