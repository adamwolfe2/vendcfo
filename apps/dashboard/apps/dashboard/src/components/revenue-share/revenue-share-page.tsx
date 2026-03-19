"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  ChevronDown,
  DollarSign,
  Download,
  Loader2,
  Mail,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Location {
  id: string;
  name: string;
  business_id: string;
  rev_share_pct?: number;
  rev_share_contact_name?: string | null;
  rev_share_contact_email?: string | null;
  rev_share_payment_method?: string | null;
  rev_share_payable_to?: string | null;
  machine_count?: number | null;
  machine_type?: string | null;
  unit_count?: number | null;
  status?: string | null;
  [key: string]: unknown;
}

interface LocationRow extends Location {
  revenue: number;
  cogs: number;
  gmPct: number;
  revMoM: number;
  monthlyShare: number;
  quarterlyShare: number;
}

type PeriodFilter = "month" | "quarter" | "year";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MACHINE_TYPES = [
  "Stockwell",
  "Micromart",
  "Micromarket",
  "Combo",
  "Snack",
  "Beverage",
  "Coffee",
  "Other",
];

const PAYMENT_METHODS = [
  "check",
  "ach",
  "boys and girls online",
  "n/a",
];

const STATUS_OPTIONS = ["current", "expansion", "inactive"];

const STATUS_COLORS: Record<string, { badge: string; header: string }> = {
  current: {
    badge: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
    header: "bg-[#22c55e]",
  },
  expansion: {
    badge: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    header: "bg-[#3b82f6]",
  },
  inactive: {
    badge: "bg-[#f3f4f6] text-[#374151] border-[#d1d5db]",
    header: "bg-[#6b7280]",
  },
};

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

function gmColor(gm: number): string {
  if (gm > 60) return "bg-[#dcfce7]";
  if (gm >= 40) return "bg-[#fef9c3]";
  return "bg-[#fee2e2]";
}

function momColor(mom: number): string {
  if (mom > 0) return "bg-[#dcfce7] text-[#166534]";
  if (mom < 0) return "bg-[#fee2e2] text-[#991b1b]";
  return "";
}

function buildRows(locations: Location[], periodMultiplier: number): LocationRow[] {
  return locations.map((loc) => {
    const machines = loc.machine_count ?? 1;
    const revSharePct = loc.rev_share_pct ?? 0;
    const baseRevenue = machines * 2500;
    const revenue = baseRevenue * periodMultiplier;
    const cogs = revenue * 0.35;
    const gmPct = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;
    // Mock MoM — random seed based on location name length
    const seed = (loc.name?.length ?? 5) % 7;
    const revMoM = seed > 3 ? (seed - 3) * 2.5 : -(4 - seed) * 1.8;
    const monthlyShare = (baseRevenue * revSharePct) / 100;
    const quarterlyShare = monthlyShare * 3;

    return {
      ...loc,
      revenue,
      cogs,
      gmPct,
      revMoM,
      monthlyShare,
      quarterlyShare,
    };
  });
}

function groupByStatus(rows: LocationRow[]): Record<string, LocationRow[]> {
  const groups: Record<string, LocationRow[]> = {
    current: [],
    expansion: [],
    inactive: [],
  };
  for (const row of rows) {
    const status = (row.status ?? "current").toLowerCase();
    if (groups[status]) {
      groups[status].push(row);
    } else {
      groups.current.push(row);
    }
  }
  return groups;
}

function computeSummary(rows: LocationRow[]) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = rows.reduce((s, r) => s + r.cogs, 0);
  const avgGm = rows.length > 0 ? rows.reduce((s, r) => s + r.gmPct, 0) / rows.length : 0;
  const totalUnits = rows.reduce((s, r) => s + (r.unit_count ?? 0), 0);
  const totalMachines = rows.reduce((s, r) => s + (r.machine_count ?? 1), 0);
  const totalMonthly = rows.reduce((s, r) => s + r.monthlyShare, 0);
  const totalQuarterly = rows.reduce((s, r) => s + r.quarterlyShare, 0);
  return { totalRevenue, totalCogs, avgGm, totalUnits, totalMachines, totalMonthly, totalQuarterly };
}

// ---------------------------------------------------------------------------
// Inline Editable Cell
// ---------------------------------------------------------------------------

function EditableCell({
  value,
  onSave,
  type = "text",
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  type?: "text" | "number";
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-[#f5f5f5] rounded px-1 py-0.5 transition-colors ${className}`}
      >
        {value || "--"}
      </span>
    );
  }

  return (
    <input
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (draft !== value) onSave(draft);
        }
        if (e.key === "Escape") {
          setEditing(false);
          setDraft(value);
        }
      }}
      autoFocus
      className="w-full rounded border border-[#d0d0d0] bg-white px-1.5 py-0.5 text-xs outline-none focus:border-[#888]"
    />
  );
}

// ---------------------------------------------------------------------------
// Dropdown Cell
// ---------------------------------------------------------------------------

function DropdownCell({
  value,
  options,
  onSave,
  className = "",
}: {
  value: string;
  options: string[];
  onSave: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onSave(e.target.value)}
      className={`cursor-pointer rounded border border-transparent bg-transparent px-1 py-0.5 text-xs outline-none hover:border-[#d0d0d0] focus:border-[#888] ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "current").toLowerCase();
  const colors = STATUS_COLORS[s] ?? STATUS_COLORS.current;
  const label = s === "expansion" ? "Expansion" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${colors.badge}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add Location Modal
// ---------------------------------------------------------------------------

function AddLocationModal({
  teamId,
  onClose,
  onSaved,
}: {
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [machineCount, setMachineCount] = useState("1");
  const [machineType, setMachineType] = useState("Combo");
  const [revSharePct, setRevSharePct] = useState("0");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [payableTo, setPayableTo] = useState("");
  const [status, setStatus] = useState("current");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("locations").insert({
      business_id: teamId,
      name: name.trim(),
      machine_count: parseInt(machineCount, 10) || 1,
      machine_type: machineType,
      rev_share_pct: parseFloat(revSharePct) || 0,
      rev_share_contact_name: contactName.trim() || null,
      rev_share_contact_email: contactEmail.trim() || null,
      rev_share_payment_method: paymentMethod,
      rev_share_payable_to: payableTo.trim() || null,
      status,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative mx-4 w-full max-w-lg rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">Add Location</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#999] transition-colors hover:text-[#333]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. ABC Office Building"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Machines</label>
              <input
                type="number"
                value={machineCount}
                onChange={(e) => setMachineCount(e.target.value)}
                min="1"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Type</label>
              <select
                value={machineType}
                onChange={(e) => setMachineType(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#888]"
              >
                {MACHINE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Rev Share %</label>
              <input
                type="number"
                value={revSharePct}
                onChange={(e) => setRevSharePct(e.target.value)}
                min="0"
                max="100"
                step="0.5"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#888]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Partner name"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none focus:border-[#888]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#888]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Payable To</label>
              <input
                type="text"
                value={payableTo}
                onChange={(e) => setPayableTo(e.target.value)}
                placeholder="Company name"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none focus:border-[#888]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-md bg-[#111] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

function exportCSV(rows: LocationRow[]) {
  const headers = [
    "Location",
    "Revenue",
    "COGS",
    "GM%",
    "Rev% MoM",
    "Units",
    "# Machines",
    "Type",
    "Rev Share %",
    "Rev Share Contact",
    "Contact Email",
    "Payment Method",
    "Monthly Share",
    "Quarterly Share",
    "Payable To",
    "Status",
  ];

  const csvRows = rows.map((r) => [
    `"${(r.name ?? "").replace(/"/g, '""')}"`,
    r.revenue.toFixed(2),
    r.cogs.toFixed(2),
    r.gmPct.toFixed(1),
    r.revMoM.toFixed(1),
    r.unit_count ?? 0,
    r.machine_count ?? 1,
    r.machine_type ?? "",
    r.rev_share_pct ?? 0,
    `"${(r.rev_share_contact_name ?? "").replace(/"/g, '""')}"`,
    r.rev_share_contact_email ?? "",
    r.rev_share_payment_method ?? "check",
    r.monthlyShare.toFixed(2),
    r.quarterlyShare.toFixed(2),
    `"${(r.rev_share_payable_to ?? "").replace(/"/g, '""')}"`,
    r.status ?? "current",
  ]);

  const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenue-share-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Group Section
// ---------------------------------------------------------------------------

function GroupSection({
  label,
  rows,
  headerColor,
  onUpdate,
  savingId,
}: {
  label: string;
  rows: LocationRow[];
  headerColor: string;
  onUpdate: (id: string, field: string, value: string | number) => void;
  savingId: string | null;
}) {
  if (rows.length === 0) return null;

  const summary = computeSummary(rows);

  return (
    <>
      {/* Group header */}
      <tr>
        <td
          colSpan={16}
          className={`px-3 py-2 text-xs font-bold text-white uppercase tracking-wider ${headerColor}`}
        >
          {label} ({rows.length})
        </td>
      </tr>

      {/* Data rows */}
      {rows.map((row) => (
        <tr
          key={row.id}
          className="border-b border-[#e6e6e6] hover:bg-[#fafafa] transition-colors"
        >
          {/* Location — sticky */}
          <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-bold text-[#111] whitespace-nowrap border-r border-[#e6e6e6] min-w-[180px]">
            {row.name}
            {savingId === row.id && (
              <span className="ml-2 text-[10px] font-normal text-[#999]">
                <Loader2 size={10} className="inline animate-spin mr-0.5" />
                Saving...
              </span>
            )}
          </td>

          {/* Revenue */}
          <td className="px-3 py-2 text-xs text-right whitespace-nowrap font-medium text-[#111]">
            {fmt(row.revenue)}
          </td>

          {/* COGS */}
          <td className="px-3 py-2 text-xs text-right whitespace-nowrap text-[#991b1b]">
            ({fmt(row.cogs)})
          </td>

          {/* GM% */}
          <td className={`px-3 py-2 text-xs text-center whitespace-nowrap font-medium ${gmColor(row.gmPct)}`}>
            {pct(row.gmPct)}
          </td>

          {/* Rev% MoM */}
          <td className={`px-3 py-2 text-xs text-center whitespace-nowrap font-medium ${momColor(row.revMoM)}`}>
            {row.revMoM > 0 ? "+" : ""}{pct(row.revMoM)}
          </td>

          {/* Units */}
          <td className="px-3 py-2 text-xs text-center whitespace-nowrap text-[#555]">
            {row.unit_count ?? "--"}
          </td>

          {/* # Machines */}
          <td className="px-3 py-2 text-xs text-center whitespace-nowrap text-[#555]">
            {row.machine_count ?? 1}
          </td>

          {/* Type */}
          <td className="px-3 py-2 text-xs whitespace-nowrap min-w-[120px]">
            <DropdownCell
              value={row.machine_type ?? "Combo"}
              options={MACHINE_TYPES}
              onSave={(v) => onUpdate(row.id, "machine_type", v)}
            />
          </td>

          {/* Rev Share % */}
          <td className="px-3 py-2 text-xs text-center whitespace-nowrap min-w-[80px]">
            <EditableCell
              value={String(row.rev_share_pct ?? 0)}
              type="number"
              onSave={(v) => onUpdate(row.id, "rev_share_pct", parseFloat(v) || 0)}
              className="text-center"
            />
          </td>

          {/* Rev Share Contact */}
          <td className="px-3 py-2 text-xs whitespace-nowrap min-w-[140px]">
            <EditableCell
              value={row.rev_share_contact_name ?? ""}
              onSave={(v) => onUpdate(row.id, "rev_share_contact_name", v)}
            />
          </td>

          {/* Contact Email */}
          <td className="px-3 py-2 text-xs whitespace-nowrap min-w-[180px]">
            {row.rev_share_contact_email ? (
              <a
                href={`mailto:${row.rev_share_contact_email}`}
                className="text-[#2563eb] hover:underline inline-flex items-center gap-1"
              >
                <Mail size={11} strokeWidth={1.5} />
                <EditableCell
                  value={row.rev_share_contact_email}
                  onSave={(v) => onUpdate(row.id, "rev_share_contact_email", v)}
                />
              </a>
            ) : (
              <EditableCell
                value=""
                onSave={(v) => onUpdate(row.id, "rev_share_contact_email", v)}
              />
            )}
          </td>

          {/* Payment Method */}
          <td className="px-3 py-2 text-xs whitespace-nowrap min-w-[140px]">
            <DropdownCell
              value={row.rev_share_payment_method ?? "check"}
              options={PAYMENT_METHODS}
              onSave={(v) => onUpdate(row.id, "rev_share_payment_method", v)}
            />
          </td>

          {/* Monthly Share */}
          <td className="px-3 py-2 text-xs text-right whitespace-nowrap font-medium text-[#111]">
            {fmt(row.monthlyShare)}
          </td>

          {/* Quarterly Share */}
          <td
            className={`px-3 py-2 text-xs text-right whitespace-nowrap font-medium text-[#111] ${
              row.quarterlyShare > 500 ? "bg-[#fef9c3]" : ""
            }`}
          >
            {fmt(row.quarterlyShare)}
          </td>

          {/* Payable To */}
          <td className="px-3 py-2 text-xs whitespace-nowrap min-w-[140px]">
            <EditableCell
              value={row.rev_share_payable_to ?? ""}
              onSave={(v) => onUpdate(row.id, "rev_share_payable_to", v)}
            />
          </td>

          {/* Status */}
          <td className="px-3 py-2 text-xs whitespace-nowrap">
            <DropdownCell
              value={row.status ?? "current"}
              options={STATUS_OPTIONS}
              onSave={(v) => onUpdate(row.id, "status", v)}
            />
          </td>
        </tr>
      ))}

      {/* Summary row */}
      <tr className="bg-[#f5f5f5] border-b-2 border-[#d0d0d0]">
        <td className="sticky left-0 z-10 bg-[#f5f5f5] px-3 py-2 text-xs font-bold text-[#333] border-r border-[#e6e6e6]">
          {label} Total
        </td>
        <td className="px-3 py-2 text-xs text-right font-bold text-[#111]">{fmt(summary.totalRevenue)}</td>
        <td className="px-3 py-2 text-xs text-right font-bold text-[#991b1b]">({fmt(summary.totalCogs)})</td>
        <td className={`px-3 py-2 text-xs text-center font-bold ${gmColor(summary.avgGm)}`}>{pct(summary.avgGm)}</td>
        <td className="px-3 py-2 text-xs text-center text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-center font-bold text-[#333]">{summary.totalUnits}</td>
        <td className="px-3 py-2 text-xs text-center font-bold text-[#333]">{summary.totalMachines}</td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-center text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-right font-bold text-[#111]">{fmt(summary.totalMonthly)}</td>
        <td className={`px-3 py-2 text-xs text-right font-bold text-[#111] ${summary.totalQuarterly > 500 ? "bg-[#fef9c3]" : ""}`}>
          {fmt(summary.totalQuarterly)}
        </td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
        <td className="px-3 py-2 text-xs text-[#999]">--</td>
      </tr>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RevenueSharePage({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const periodMultiplier = period === "month" ? 1 : period === "quarter" ? 3 : 12;

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("business_id", teamId)
      .order("name", { ascending: true });

    setLocations((data as Location[]) ?? []);
    setLoading(false);
  }, [supabase, teamId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const rows = useMemo(() => buildRows(locations, periodMultiplier), [locations, periodMultiplier]);
  const groups = useMemo(() => groupByStatus(rows), [rows]);

  const handleUpdate = useCallback(
    async (id: string, field: string, value: string | number) => {
      setSavingId(id);

      await supabase
        .from("locations")
        .update({ [field]: value })
        .eq("id", id);

      // Update local state
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
      );

      setSavingId(null);
    },
    [supabase]
  );

  const allRows = useMemo(() => [...groups.current, ...groups.expansion, ...groups.inactive], [groups]);

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Revenue Share</h1>
          <p className="mt-1 text-sm text-[#666]">
            Track location partner revenue sharing, payouts, and contact details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="appearance-none rounded-md border border-[#d0d0d0] bg-white pl-3 pr-8 py-2 text-sm text-[#333] outline-none focus:border-[#888]"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
            />
          </div>

          {/* Export */}
          <button
            type="button"
            onClick={() => exportCSV(allRows)}
            disabled={allRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d0d0] bg-white px-3.5 py-2 text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50"
          >
            <Download size={15} strokeWidth={1.5} />
            Export CSV
          </button>

          {/* Add Location */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            <Plus size={15} strokeWidth={1.5} />
            Add Location
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded border border-[#e0e0e0] bg-[#f5f5f5]"
            />
          ))}
        </div>
      ) : allRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
          <DollarSign size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
          <p className="text-sm font-medium text-[#555]">No locations with revenue share data</p>
          <p className="mt-1 text-xs text-[#999]">
            Click "Add Location" to start tracking revenue share.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e0e0e0]">
                <th className="sticky left-0 z-20 bg-[#f9f9f9] px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider border-r border-[#e6e6e6] min-w-[180px]">
                  Location
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-right whitespace-nowrap">
                  Revenue
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-right whitespace-nowrap">
                  COGS
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-center whitespace-nowrap">
                  GM%
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-center whitespace-nowrap">
                  Rev% MoM
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-center whitespace-nowrap">
                  Units
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-center whitespace-nowrap">
                  # Machines
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Type
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-center whitespace-nowrap">
                  Rev Share %
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Rev Share Contact
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Contact Email
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Payment Method
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-right whitespace-nowrap">
                  Monthly Share
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider text-right whitespace-nowrap">
                  Quarterly Share
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Payable To
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <GroupSection
                label="Current"
                rows={groups.current}
                headerColor={STATUS_COLORS.current.header}
                onUpdate={handleUpdate}
                savingId={savingId}
              />
              <GroupSection
                label="Expansion Confirmed"
                rows={groups.expansion}
                headerColor={STATUS_COLORS.expansion.header}
                onUpdate={handleUpdate}
                savingId={savingId}
              />
              <GroupSection
                label="Inactive"
                rows={groups.inactive}
                headerColor={STATUS_COLORS.inactive.header}
                onUpdate={handleUpdate}
                savingId={savingId}
              />
            </tbody>
          </table>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <AddLocationModal
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchLocations}
        />
      )}
    </div>
  );
}
