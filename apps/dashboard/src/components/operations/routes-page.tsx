"use client";

import { createClient } from "@vendcfo/supabase/client";
import { MapPin, Pencil, Plus, Route, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Route size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No routes yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Click "Add Route" to create your first service route.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
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
  const supabase = createClient();
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
            className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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

export function RoutesPage({
  initialData,
  teamId,
}: {
  initialData: RouteRow[];
  teamId: string;
}) {
  const supabase = createClient();
  const [routes, setRoutes] = useState<RouteRow[]>(initialData);
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
    const { error } = await supabase.from("routes").delete().eq("id", deleteId);
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
            Manage your service routes and track location assignments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
        >
          <Plus size={16} strokeWidth={1.5} />
          Add Route
        </button>
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
      ) : routes.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
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
                        onClick={() => setEditEntry(route)}
                        title="Edit"
                        className="rounded p-2 text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                      >
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(route.id)}
                        title="Delete"
                        className="rounded p-2 text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
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

      {/* Count */}
      {!loading && routes.length > 0 && (
        <p className="mt-4 text-xs text-[#999]">
          {routes.length} route{routes.length !== 1 ? "s" : ""}
        </p>
      )}

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
