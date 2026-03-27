"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { CsvExportButton } from "@/components/csv-export-button";
import { exportToCsv } from "@/utils/csv-export";
import { createClient } from "@vendcfo/supabase/client";
import { Building2, Pencil, Plus, Server, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocationRow {
  id: string;
  business_id: string;
  route_id: string | null;
  name: string;
  address: string | null;
  location_type: string | null;
  rev_share_pct: number | null;
  contact_name: string | null;
  contact_email: string | null;
  monthly_rent: number | null;
  service_frequency_days: number | null;
  is_active: boolean;
  created_at: string;
  routes: { name: string } | null;
  machines: { count: number }[];
}

interface RouteOption {
  id: string;
  name: string;
}

const LOCATION_TYPES = [
  "office",
  "school",
  "gym",
  "transit",
  "hospital",
  "manufacturing",
  "retail",
  "other",
] as const;

const TYPE_LABELS: Record<string, string> = {
  office: "Office",
  school: "School",
  gym: "Gym",
  transit: "Transit / Mall",
  hospital: "Hospital",
  manufacturing: "Manufacturing",
  retail: "Retail",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Building2 size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No locations yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Click "Add Location" to create your first vending location.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Location
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function LocationModal({
  mode,
  entry,
  teamId,
  routeOptions,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: LocationRow | null;
  teamId: string;
  routeOptions: RouteOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase: any = createClient();
  const [name, setName] = useState(entry?.name ?? "");
  const [address, setAddress] = useState(entry?.address ?? "");
  const [routeId, setRouteId] = useState(entry?.route_id ?? "");
  const [locationType, setLocationType] = useState(
    entry?.location_type ?? "office",
  );
  const [revSharePct, setRevSharePct] = useState(
    String(entry?.rev_share_pct ?? "0"),
  );
  const [monthlyRent, setMonthlyRent] = useState(
    String(entry?.monthly_rent ?? "0"),
  );
  const [contactName, setContactName] = useState(entry?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(entry?.contact_email ?? "");
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
      address: address.trim() || null,
      route_id: routeId || null,
      location_type: locationType,
      rev_share_pct: Number.parseFloat(revSharePct) || 0,
      monthly_rent: Number.parseFloat(monthlyRent) || 0,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      is_active: isActive,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("locations")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { business_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase
          .from("locations")
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
            {mode === "add" ? "Add Location" : "Edit Location"}
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
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Metro Office Park - Lobby"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1200 Commerce Blvd, Austin TX"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Route
              </label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                <option value="">Unassigned</option>
                {routeOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Rev Share %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={revSharePct}
                onChange={(e) => setRevSharePct(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Monthly Rent ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
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
                placeholder="John Doe"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          </div>

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
                  ? "Add Location"
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
        <h3 className="text-lg font-semibold text-[#111]">Delete Location</h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this location? This action cannot be
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
// Main Component
// ---------------------------------------------------------------------------

export function LocationsPage({
  initialData,
  teamId,
}: {
  initialData: LocationRow[];
  teamId: string;
}) {
  const supabase: any = createClient();
  const [locations, setLocations] = useState<LocationRow[]>(initialData);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<LocationRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch route options for the dropdown
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("routes")
        .select("id, name")
        .eq("business_id", teamId)
        .order("name");
      if (data) setRouteOptions(data);
    })();
  }, [supabase, teamId]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("*, routes(name), machines(count)")
      .eq("business_id", teamId)
      .order("name", { ascending: true });
    if (data) setLocations(data as LocationRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", deleteId)
      .eq("business_id", teamId);
    if (!error) {
      setLocations((prev) => prev.filter((l) => l.id !== deleteId));
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
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage location agreements, revenue share, and machine placements.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <AskRouteCFO prompt="Compare my locations by revenue and commission rate. Which ones should I renegotiate?" />
          <CsvExportButton
            onClick={() => {
              if (locations.length === 0) return;
              exportToCsv(
                `locations-${new Date().toISOString().slice(0, 10)}`,
                locations.map((loc) => ({
                  name: loc.name,
                  address: loc.address ?? "",
                  route: loc.routes?.name ?? "Unassigned",
                  machines: loc.machines?.[0]?.count ?? 0,
                  rev_share_pct: loc.rev_share_pct ?? "",
                  monthly_rent: loc.monthly_rent ?? "",
                  type: loc.location_type ?? "",
                  status: loc.is_active ? "Active" : "Inactive",
                  contact_name: loc.contact_name ?? "",
                  contact_email: loc.contact_email ?? "",
                })),
                [
                  { key: "name", header: "Location" },
                  { key: "address", header: "Address" },
                  { key: "route", header: "Route" },
                  { key: "machines", header: "Machines" },
                  { key: "rev_share_pct", header: "Rev Share %" },
                  { key: "monthly_rent", header: "Monthly Rent" },
                  { key: "type", header: "Type" },
                  { key: "status", header: "Status" },
                  { key: "contact_name", header: "Contact Name" },
                  { key: "contact_email", header: "Contact Email" },
                ],
              );
            }}
          />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Location
          </button>
        </div>
      </div>

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
      ) : locations.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Location
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Address
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Route
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Machines
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Rev Share
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Rent/mo
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Type
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
              {locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
                        <Building2 size={16} strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-[#111]">
                        {loc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#666] max-w-[200px] truncate">
                    {loc.address || "--"}
                  </td>
                  <td className="px-4 py-3 text-[#666]">
                    {loc.routes?.name || "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[#555]">
                      <Server
                        size={14}
                        strokeWidth={1.5}
                        className="text-[#999]"
                      />
                      {loc.machines?.[0]?.count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[#555]">
                    {loc.rev_share_pct != null ? `${loc.rev_share_pct}%` : "--"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#555]">
                    {loc.monthly_rent != null && loc.monthly_rent > 0
                      ? `$${Number(loc.monthly_rent).toLocaleString()}`
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium capitalize text-[#555]">
                      {TYPE_LABELS[loc.location_type ?? ""] ??
                        loc.location_type ??
                        "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        loc.is_active
                          ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                          : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                      }`}
                    >
                      {loc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditEntry(loc)}
                        title="Edit"
                        className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                      >
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(loc.id)}
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

      {!loading && locations.length > 0 && (
        <p className="mt-4 text-xs text-[#999]">
          {locations.length} location{locations.length !== 1 ? "s" : ""}
        </p>
      )}

      {showAddModal && (
        <LocationModal
          mode="add"
          teamId={teamId}
          routeOptions={routeOptions}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchLocations}
        />
      )}
      {editEntry && (
        <LocationModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          routeOptions={routeOptions}
          onClose={() => setEditEntry(null)}
          onSaved={fetchLocations}
        />
      )}
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
