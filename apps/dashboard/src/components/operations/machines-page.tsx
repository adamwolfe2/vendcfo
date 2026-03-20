"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  Pencil,
  Plus,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MachineRow {
  id: string;
  business_id: string;
  location_id: string | null;
  serial_number: string;
  make_model: string | null;
  machine_type: string | null;
  capacity_slots: number | null;
  date_acquired: string | null;
  purchase_price: number | null;
  is_active: boolean;
  created_at: string;
  locations: { name: string } | null;
}

interface LocationOption {
  id: string;
  name: string;
}

const MACHINE_TYPES = ["combo", "snack", "beverage", "coffee", "ice", "other"] as const;

const TYPE_LABELS: Record<string, string> = {
  combo: "Combo",
  snack: "Snack",
  beverage: "Beverage",
  coffee: "Coffee",
  ice: "Ice",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Server size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No machines yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Click "Add Machine" to register your first vending machine.
      </p>
      <button type="button" onClick={onAdd} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]">
        <Plus size={16} strokeWidth={1.5} />
        Add Machine
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function MachineModal({
  mode,
  entry,
  teamId,
  locationOptions,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: MachineRow | null;
  teamId: string;
  locationOptions: LocationOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [serialNumber, setSerialNumber] = useState(entry?.serial_number ?? "");
  const [makeModel, setMakeModel] = useState(entry?.make_model ?? "");
  const [machineType, setMachineType] = useState(entry?.machine_type ?? "combo");
  const [locationId, setLocationId] = useState(entry?.location_id ?? "");
  const [capacitySlots, setCapacitySlots] = useState(String(entry?.capacity_slots ?? "40"));
  const [purchasePrice, setPurchasePrice] = useState(String(entry?.purchase_price ?? "0"));
  const [dateAcquired, setDateAcquired] = useState(entry?.date_acquired ?? "");
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      business_id: teamId,
      serial_number: serialNumber.trim(),
      make_model: makeModel.trim() || null,
      machine_type: machineType,
      location_id: locationId || null,
      capacity_slots: parseInt(capacitySlots) || null,
      purchase_price: parseFloat(purchasePrice) || null,
      date_acquired: dateAcquired || null,
      is_active: isActive,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase.from("machines").insert(payload);
        if (insertError) { setError(insertError.message); setSaving(false); return; }
      } else if (entry) {
        const { business_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase.from("machines").update(updatePayload).eq("id", entry.id);
        if (updateError) { setError(updateError.message); setSaving(false); return; }
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
            {mode === "add" ? "Add Machine" : "Edit Machine"}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:text-[#333]">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required placeholder="SN-2024-001" className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Make / Model</label>
            <input type="text" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} placeholder="AMS Sensit 3 Combo" className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Machine Type</label>
              <select value={machineType} onChange={(e) => setMachineType(e.target.value)} className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]">
                {MACHINE_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]">
                <option value="">Unassigned</option>
                {locationOptions.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Capacity (slots)</label>
              <input type="number" min="0" value={capacitySlots} onChange={(e) => setCapacitySlots(e.target.value)} className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Purchase Price ($)</label>
              <input type="number" step="0.01" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Date Acquired</label>
              <input type="date" value={dateAcquired} onChange={(e) => setDateAcquired(e.target.value)} className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive(!isActive)} className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? "bg-[#111]" : "bg-[#d0d0d0]"}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${isActive ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <span className="text-sm text-[#555]">Active</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] w-full sm:w-auto">Cancel</button>
            <button type="submit" disabled={saving || !serialNumber.trim()} className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto">
              {saving ? "Saving..." : mode === "add" ? "Add Machine" : "Save Changes"}
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
        <h3 className="text-lg font-semibold text-[#111]">Delete Machine</h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this machine? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={deleting} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
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

export function MachinesPage({
  initialData,
  teamId,
}: {
  initialData: MachineRow[];
  teamId: string;
}) {
  const supabase = createClient();
  const [machines, setMachines] = useState<MachineRow[]>(initialData);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<MachineRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("locations")
        .select("id, name")
        .eq("business_id", teamId)
        .order("name");
      if (data) setLocationOptions(data);
    })();
  }, [supabase, teamId]);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("machines")
      .select("*, locations(name)")
      .eq("business_id", teamId)
      .order("serial_number", { ascending: true });
    if (data) setMachines(data as MachineRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("machines").delete().eq("id", deleteId);
    if (!error) {
      setMachines((prev) => prev.filter((m) => m.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Equipment & Machines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track machine inventory, locations, and purchase history.
          </p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto">
          <Plus size={16} strokeWidth={1.5} />
          Add Machine
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]" />
          ))}
        </div>
      ) : machines.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">Serial / Model</th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">Type</th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">Location</th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">Capacity</th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">Purchase Price</th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">Acquired</th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((mac) => (
                <tr key={mac.id} className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
                        <Server size={16} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-semibold text-[#111]">{mac.serial_number}</div>
                        <div className="text-xs text-[#888]">{mac.make_model || "--"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium capitalize text-[#555]">
                      {TYPE_LABELS[mac.machine_type ?? ""] ?? mac.machine_type ?? "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#666]">{mac.locations?.name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-center font-mono text-[#555]">{mac.capacity_slots ?? "--"}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#555]">
                    {mac.purchase_price != null ? `$${Number(mac.purchase_price).toLocaleString()}` : "--"}
                  </td>
                  <td className="px-4 py-3 text-center text-[#888] text-xs">
                    {mac.date_acquired ? new Date(mac.date_acquired).toLocaleDateString() : "--"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      mac.is_active
                        ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                        : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                    }`}>
                      {mac.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setEditEntry(mac)} title="Edit" className="rounded p-2 text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]">
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                      <button type="button" onClick={() => setDeleteId(mac.id)} title="Delete" className="rounded p-2 text-[#999] transition-colors hover:bg-red-50 hover:text-red-600">
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

      {!loading && machines.length > 0 && (
        <p className="mt-4 text-xs text-[#999]">
          {machines.length} machine{machines.length !== 1 ? "s" : ""}
        </p>
      )}

      {showAddModal && (
        <MachineModal mode="add" teamId={teamId} locationOptions={locationOptions} onClose={() => setShowAddModal(false)} onSaved={fetchMachines} />
      )}
      {editEntry && (
        <MachineModal mode="edit" entry={editEntry} teamId={teamId} locationOptions={locationOptions} onClose={() => setEditEntry(null)} onSaved={fetchMachines} />
      )}
      {deleteId && (
        <DeleteConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} deleting={deleting} />
      )}
    </div>
  );
}
