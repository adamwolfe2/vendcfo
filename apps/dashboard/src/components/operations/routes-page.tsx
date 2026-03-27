"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import {
  Calendar,
  MapPin,
  Pencil,
  Plus,
  Route,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteRow {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  operator_id: string | null;
  is_active: boolean;
  created_at: string;
  locations: { count: number }[];
}

interface LocationRow {
  id: string;
  name: string;
  stock_hours: string | number | null;
  pick_hours: string | number | null;
  route_id: string | null;
}

interface ScheduleRow {
  id: string;
  business_id: string;
  location_id: string;
  day_of_week: number;
  action: string;
}

interface OperatorPlanRow {
  id: string;
  business_id: string;
  operator_id: string;
  week_start: string;
  day_of_week: number;
  planned_stops: number | null;
  planned_driving_hrs: string | number | null;
  planned_gas_tolls_hrs: string | number | null;
  planned_warehouse_hrs: string | number | null;
  planned_load_van_hrs: string | number | null;
  planned_stock_hrs: string | number | null;
  planned_pick_hrs: string | number | null;
  actual_stops: number | null;
  actual_driving_hrs: string | number | null;
  actual_gas_tolls_hrs: string | number | null;
  actual_warehouse_hrs: string | number | null;
  actual_load_van_hrs: string | number | null;
  actual_stock_hrs: string | number | null;
  actual_pick_hrs: string | number | null;
  users?: { full_name: string | null; email: string } | null;
}

interface OperatorRateRow {
  id: string;
  business_id: string;
  operator_id: string;
  hourly_rate: string | number;
  gas_rate_per_hr: string | number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DEFAULT_HOURLY_RATE = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  return Number.isNaN(n) ? 0 : n;
}

function fmtHrs(val: number): string {
  return val === 0 ? "-" : val.toFixed(2);
}

function fmtCurrency(val: number): string {
  return `$${val.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Schedule Cell
// ---------------------------------------------------------------------------

function ScheduleCell({ action }: { action: string | undefined }) {
  if (!action || action === "nothing") {
    return (
      <span
        className="inline-block rounded px-2 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: "#3b82f6" }}
      >
        Nothing
      </span>
    );
  }
  if (action === "pick_stock") {
    return (
      <span
        className="inline-block rounded px-2 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: "#ef4444" }}
      >
        Pick/Stock
      </span>
    );
  }
  // "pick" or "stock" — yellow
  return (
    <span
      className="inline-block rounded px-2 py-1 text-xs font-medium text-black"
      style={{ backgroundColor: "#eab308" }}
    >
      Pick/Stock
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Location Schedule Grid
// ---------------------------------------------------------------------------

function LocationScheduleGrid({
  locations,
  schedules,
}: {
  locations: LocationRow[];
  schedules: ScheduleRow[];
}) {
  // Build a lookup: locationId -> dayOfWeek -> action
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<number, string>> = {};
    for (const s of schedules) {
      if (!map[s.location_id]) {
        map[s.location_id] = {};
      }
      (map[s.location_id] as Record<number, string>)[s.day_of_week] = s.action;
    }
    return map;
  }, [schedules]);

  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-12 text-center">
        <Calendar size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[#bbb]" />
        <p className="text-sm text-[#666]">No locations with schedules yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
            <th className="sticky left-0 z-10 bg-[#fafafa] px-4 py-3 text-left font-medium text-[#555]">
              Location
            </th>
            <th className="px-3 py-3 text-center font-medium text-[#555]">
              Stock (hrs)
            </th>
            <th className="px-3 py-3 text-center font-medium text-[#555]">
              Pick (hrs)
            </th>
            {DAY_LABELS.map((day) => (
              <th
                key={day}
                className="px-3 py-3 text-center font-medium text-[#555]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => {
            const locSchedule = scheduleMap[loc.id] ?? {};
            return (
              <tr
                key={loc.id}
                className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa]"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-[#111]">
                  {loc.name}
                </td>
                <td className="px-3 py-3 text-center text-[#555]">
                  {fmtHrs(toNum(loc.stock_hours))}
                </td>
                <td className="px-3 py-3 text-center text-[#555]">
                  {fmtHrs(toNum(loc.pick_hours))}
                </td>
                {DAY_LABELS.map((_, idx) => (
                  <td key={idx} className="px-3 py-3 text-center">
                    <ScheduleCell action={locSchedule[idx]} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Operator Weekly Summary
// ---------------------------------------------------------------------------

interface OperatorSummary {
  operatorId: string;
  operatorName: string;
  hourlyRate: number;
  days: Record<
    number,
    {
      stops: number;
      driving: number;
      gasTolls: number;
      warehouse: number;
      loadVan: number;
      stock: number;
      pick: number;
    }
  >;
}

const ROW_LABELS = [
  "Stops",
  "Driving",
  "Gas/Tolls",
  "Warehouse Clean up/IM",
  "Warehouse Load Van",
  "Stock",
  "Pick",
] as const;

const ROW_KEYS = [
  "stops",
  "driving",
  "gasTolls",
  "warehouse",
  "loadVan",
  "stock",
  "pick",
] as const;

const OPERATOR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
];

function OperatorWeeklySummary({
  operatorPlans,
  operatorRates,
}: {
  operatorPlans: OperatorPlanRow[];
  operatorRates: OperatorRateRow[];
}) {
  const operators = useMemo(() => {
    const rateMap: Record<string, number> = {};
    for (const r of operatorRates) {
      rateMap[r.operator_id] = toNum(r.hourly_rate);
    }

    const opMap: Record<string, OperatorSummary> = {};
    for (const plan of operatorPlans) {
      if (!opMap[plan.operator_id]) {
        const userName =
          plan.users?.full_name || plan.users?.email || "Unknown Operator";
        opMap[plan.operator_id] = {
          operatorId: plan.operator_id,
          operatorName: userName,
          hourlyRate: rateMap[plan.operator_id] ?? DEFAULT_HOURLY_RATE,
          days: {},
        };
      }
      const op = opMap[plan.operator_id] as OperatorSummary;
      op.days[plan.day_of_week] = {
        stops: plan.planned_stops ?? 0,
        driving: toNum(plan.planned_driving_hrs),
        gasTolls: toNum(plan.planned_gas_tolls_hrs),
        warehouse: toNum(plan.planned_warehouse_hrs),
        loadVan: toNum(plan.planned_load_van_hrs),
        stock: toNum(plan.planned_stock_hrs),
        pick: toNum(plan.planned_pick_hrs),
      };
    }

    return Object.values(opMap);
  }, [operatorPlans, operatorRates]);

  if (operators.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-12 text-center">
        <Users size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[#bbb]" />
        <p className="text-sm text-[#666]">
          No operator plans for this week yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {operators.map((op, opIdx) => {
        const colorSet =
          OPERATOR_COLORS[opIdx % OPERATOR_COLORS.length] as (typeof OPERATOR_COLORS)[number];

        // Compute per-row totals
        const rowTotals: Record<string, number> = {};
        for (const key of ROW_KEYS) {
          let sum = 0;
          for (let d = 0; d < 6; d++) {
            const dayData = op.days[d];
            sum += dayData ? dayData[key] : 0;
          }
          rowTotals[key] = sum;
        }

        const totalHours =
          (rowTotals.driving ?? 0) +
          (rowTotals.gasTolls ?? 0) +
          (rowTotals.warehouse ?? 0) +
          (rowTotals.loadVan ?? 0) +
          (rowTotals.stock ?? 0) +
          (rowTotals.pick ?? 0);

        const totalCost = totalHours * op.hourlyRate;

        return (
          <div
            key={op.operatorId}
            className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white"
          >
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                {/* Operator header row */}
                <tr className={`${colorSet.bg} ${colorSet.border} border-b`}>
                  <th
                    className={`px-4 py-3 text-left font-semibold ${colorSet.text}`}
                    colSpan={9}
                  >
                    {op.operatorName} -- @ {fmtCurrency(op.hourlyRate)}/hr
                  </th>
                </tr>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="sticky left-0 z-10 bg-[#fafafa] px-4 py-2 text-left font-medium text-[#555]">
                    Category
                  </th>
                  {DAY_LABELS.map((day) => (
                    <th
                      key={day}
                      className="px-3 py-2 text-center font-medium text-[#555]"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium text-[#555]">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-[#555]">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROW_LABELS.map((label, rowIdx) => {
                  const key = ROW_KEYS[rowIdx] as (typeof ROW_KEYS)[number];
                  const isStops = key === "stops";
                  const total = rowTotals[key] ?? 0;
                  const cost = isStops ? 0 : total * op.hourlyRate;

                  return (
                    <tr
                      key={key}
                      className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa]"
                    >
                      <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-[#333]">
                        {label}
                      </td>
                      {DAY_LABELS.map((_, dayIdx) => {
                        const dayData = op.days[dayIdx];
                        const val = dayData ? dayData[key] : 0;
                        return (
                          <td
                            key={dayIdx}
                            className="px-3 py-2 text-center text-[#555]"
                          >
                            {isStops
                              ? val === 0
                                ? "-"
                                : val
                              : fmtHrs(val)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-medium text-[#111]">
                        {isStops
                          ? total === 0
                            ? "-"
                            : total
                          : fmtHrs(total)}
                      </td>
                      <td className="px-3 py-2 text-center text-[#555]">
                        {isStops ? "-" : fmtCurrency(cost)}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="border-t-2 border-[#ddd] bg-[#fafafa]">
                  <td className="sticky left-0 z-10 bg-[#fafafa] px-4 py-2 font-bold text-[#111]">
                    Operator Total
                  </td>
                  {DAY_LABELS.map((_, dayIdx) => {
                    const dayData = op.days[dayIdx];
                    if (!dayData) {
                      return (
                        <td
                          key={dayIdx}
                          className="px-3 py-2 text-center text-[#999]"
                        >
                          -
                        </td>
                      );
                    }
                    const dayTotal =
                      dayData.driving +
                      dayData.gasTolls +
                      dayData.warehouse +
                      dayData.loadVan +
                      dayData.stock +
                      dayData.pick;
                    return (
                      <td
                        key={dayIdx}
                        className="px-3 py-2 text-center font-medium text-[#111]"
                      >
                        {fmtHrs(dayTotal)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-bold text-[#111]">
                    {fmtHrs(totalHours)}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-red-600">
                    {fmtCurrency(totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Route size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No routes yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Click &quot;Add Route&quot; to create your first service route.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Route
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function RouteModal({
  mode,
  entry,
  teamId,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: RouteRow | null;
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase: any = createClient();
  const [name, setName] = useState(entry?.name ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase.from("routes").insert({
          business_id: teamId,
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        });
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { error: updateError } = await supabase
          .from("routes")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            is_active: isActive,
          })
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
            {mode === "add" ? "Add Route" : "Edit Route"}
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
              Route Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Austin Downtown"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the route area"
              rows={3}
              className="w-full resize-none rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                isActive ? "bg-[#111]" : "bg-[#d0d0d0]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                  isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-[#555]">Active</span>
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
                  ? "Add Route"
                  : "Save Changes"}
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
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative mx-4 w-full max-w-sm rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#111]">Delete Route</h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this route? This action cannot be
          undone.
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
// Routes Table (original, kept below the new grids)
// ---------------------------------------------------------------------------

function RoutesTable({
  routes,
  onEdit,
  onDelete,
}: {
  routes: RouteRow[];
  onEdit: (route: RouteRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
            <th className="px-4 py-3 text-left font-medium text-[#555]">
              Route Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-[#555]">
              Description
            </th>
            <th className="px-4 py-3 text-center font-medium text-[#555]">
              Locations
            </th>
            <th className="px-4 py-3 text-center font-medium text-[#555]">
              Status
            </th>
            <th className="px-4 py-3 text-center font-medium text-[#555]">
              Created
            </th>
            <th className="px-4 py-3 text-right font-medium text-[#555]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr
              key={route.id}
              className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
                    <Route size={16} strokeWidth={1.5} />
                  </div>
                  <span className="font-semibold text-[#111]">
                    {route.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#666] max-w-xs truncate">
                {route.description || "--"}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 text-[#555]">
                  <MapPin
                    size={14}
                    strokeWidth={1.5}
                    className="text-[#999]"
                  />
                  {route.locations?.[0]?.count ?? 0}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    route.is_active
                      ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                      : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                  }`}
                >
                  {route.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-[#888] text-xs">
                {route.created_at
                  ? new Date(route.created_at).toLocaleDateString()
                  : "--"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(route)}
                    title="Edit"
                    className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                  >
                    <Pencil size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(route.id)}
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RoutesPage({
  initialData,
  initialLocations,
  initialSchedules,
  initialOperatorPlans,
  initialOperatorRates,
  teamId,
  weekStart,
}: {
  initialData: RouteRow[];
  initialLocations: LocationRow[];
  initialSchedules: ScheduleRow[];
  initialOperatorPlans: OperatorPlanRow[];
  initialOperatorRates: OperatorRateRow[];
  teamId: string;
  weekStart: string;
}) {
  const supabase: any = createClient();
  const [routes, setRoutes] = useState<RouteRow[]>(initialData);
  const [locations] = useState<LocationRow[]>(initialLocations);
  const [schedules] = useState<ScheduleRow[]>(initialSchedules);
  const [operatorPlans] = useState<OperatorPlanRow[]>(initialOperatorPlans);
  const [operatorRates] = useState<OperatorRateRow[]>(initialOperatorRates);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<RouteRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("routes")
      .select("*, locations(count)")
      .eq("business_id", teamId)
      .order("name", { ascending: true });
    if (data) setRoutes(data as RouteRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("routes")
      .delete()
      .eq("id", deleteId);
    if (!error) {
      setRoutes((prev) => prev.filter((r) => r.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Routes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operations dashboard -- weekly schedules, operator plans, and route
            management.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <AskRouteCFO prompt="Analyze my route performance and tell me which routes need attention" />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Route
          </button>
        </div>
      </div>

      {/* Section 1: Location Schedule Grid */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={18} strokeWidth={1.5} className="text-[#666]" />
          <h2 className="text-base font-semibold text-[#111]">
            Location Schedule
          </h2>
          <span className="text-xs text-[#999]">
            Week of{" "}
            {new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <LocationScheduleGrid locations={locations} schedules={schedules} />
      </div>

      {/* Section 2: Operator Weekly Summary */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Users size={18} strokeWidth={1.5} className="text-[#666]" />
          <h2 className="text-base font-semibold text-[#111]">
            Operator Weekly Summary
          </h2>
        </div>
        <OperatorWeeklySummary
          operatorPlans={operatorPlans}
          operatorRates={operatorRates}
        />
      </div>

      {/* Section 3: Routes Table */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Route size={18} strokeWidth={1.5} className="text-[#666]" />
          <h2 className="text-base font-semibold text-[#111]">Routes</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
              />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <RoutesTable
            routes={routes}
            onEdit={setEditEntry}
            onDelete={setDeleteId}
          />
        )}

        {!loading && routes.length > 0 && (
          <p className="mt-4 text-xs text-[#999]">
            {routes.length} route{routes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <RouteModal
          mode="add"
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchRoutes}
        />
      )}

      {/* Edit Modal */}
      {editEntry && (
        <RouteModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchRoutes}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
