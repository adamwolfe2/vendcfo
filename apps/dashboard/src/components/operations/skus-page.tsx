"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import { PackageOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkuRow {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  unit_cost: number | null;
  retail_price: number | null;
  target_margin_pct: number | null;
  upc_code: string | null;
  supplier: string | null;
  created_at: string;
}

const CATEGORIES = [
  "soda",
  "water",
  "energy_drink",
  "chips",
  "candy",
  "pastry",
  "healthy",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  soda: "Soda",
  water: "Water",
  energy_drink: "Energy Drink",
  chips: "Chips",
  candy: "Candy",
  pastry: "Pastry",
  healthy: "Healthy",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  soda: "bg-[#eef6ff] text-[#2563eb] border-[#bfdbfe]",
  water: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  energy_drink: "bg-[#fef3e2] text-[#b45309] border-[#fde68a]",
  chips: "bg-[#fdf2f8] text-[#db2777] border-[#fbcfe8]",
  candy: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  pastry: "bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]",
  healthy: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  other: "bg-[#f0f0f0] text-[#555] border-[#ddd]",
};

function computeMargin(
  cost: number | null,
  price: number | null,
): number | null {
  if (!cost || !price || price === 0) return null;
  return Math.round(((price - cost) / price) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <PackageOpen size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No products yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Click "Add Product" to add your first SKU.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Product
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function SkuModal({
  mode,
  entry,
  teamId,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: SkuRow | null;
  teamId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase: any = createClient();
  const [name, setName] = useState(entry?.name ?? "");
  const [category, setCategory] = useState(entry?.category ?? "soda");
  const [unitCost, setUnitCost] = useState(String(entry?.unit_cost ?? "0"));
  const [retailPrice, setRetailPrice] = useState(
    String(entry?.retail_price ?? "0"),
  );
  const [upcCode, setUpcCode] = useState(entry?.upc_code ?? "");
  const [supplier, setSupplier] = useState(entry?.supplier ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costNum = Number.parseFloat(unitCost) || 0;
  const priceNum = Number.parseFloat(retailPrice) || 0;
  const margin =
    priceNum > 0
      ? Math.round(((priceNum - costNum) / priceNum) * 1000) / 10
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      business_id: teamId,
      name: name.trim(),
      category,
      unit_cost: costNum,
      retail_price: priceNum,
      target_margin_pct: margin,
      upc_code: upcCode.trim() || null,
      supplier: supplier.trim() || null,
    };

    try {
      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("skus")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { business_id, ...updatePayload } = payload;
        const { error: updateError } = await supabase
          .from("skus")
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
            {mode === "add" ? "Add Product" : "Edit Product"}
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
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Coca-Cola 20oz"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Retail Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Margin
              </label>
              <div className="flex h-[38px] items-center rounded-md border border-[#e0e0e0] bg-[#fafafa] px-3 text-sm font-mono text-[#555]">
                {margin}%
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              UPC Code
            </label>
            <input
              type="text"
              value={upcCode}
              onChange={(e) => setUpcCode(e.target.value)}
              placeholder="049000042559"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Supplier
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="PepsiCo Bottling"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
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
              disabled={saving || !name.trim()}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Add Product"
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
        <h3 className="text-lg font-semibold text-[#111]">Delete Product</h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this product? This action cannot be
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

export function SkusPage({
  initialData,
  teamId,
}: {
  initialData: SkuRow[];
  teamId: string;
}) {
  const supabase: any = createClient();
  const [skus, setSkus] = useState<SkuRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SkuRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSkus = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("skus")
      .select("*")
      .eq("business_id", teamId)
      .order("name", { ascending: true });
    if (data) setSkus(data as SkuRow[]);
    setLoading(false);
  }, [supabase, teamId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("skus").delete().eq("id", deleteId).eq("business_id", teamId);
    if (!error) {
      setSkus((prev) => prev.filter((s) => s.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Products & SKUs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product catalog, pricing, and margin analysis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <AskRouteCFO prompt="Analyze my product margins. Am I stocking the right mix?" />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Product
          </button>
        </div>
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
      ) : skus.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Product
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Category
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Retail Price
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Margin %
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  UPC
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Supplier
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku) => {
                const margin = computeMargin(
                  Number(sku.unit_cost),
                  Number(sku.retail_price),
                );
                return (
                  <tr
                    key={sku.id}
                    className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
                          <PackageOpen size={16} strokeWidth={1.5} />
                        </div>
                        <span className="font-semibold text-[#111]">
                          {sku.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          CATEGORY_COLORS[sku.category ?? ""] ??
                          CATEGORY_COLORS.other
                        }`}
                      >
                        {CATEGORY_LABELS[sku.category ?? ""] ??
                          sku.category ??
                          "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#555]">
                      {sku.unit_cost != null
                        ? `$${Number(sku.unit_cost).toFixed(2)}`
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#555]">
                      {sku.retail_price != null
                        ? `$${Number(sku.retail_price).toFixed(2)}`
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      {margin != null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${margin < 30 ? "text-red-500" : "text-green-600"}`}
                          >
                            {margin}%
                          </span>
                          <div className="w-16 bg-[#e0e0e0] rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${margin < 30 ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(margin, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#999]">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#888] font-mono text-xs">
                      {sku.upc_code || "--"}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {sku.supplier || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditEntry(sku)}
                          title="Edit"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                        >
                          <Pencil size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(sku.id)}
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

      {!loading && skus.length > 0 && (
        <p className="mt-4 text-xs text-[#999]">
          {skus.length} product{skus.length !== 1 ? "s" : ""}
        </p>
      )}

      {showAddModal && (
        <SkuModal
          mode="add"
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchSkus}
        />
      )}
      {editEntry && (
        <SkuModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchSkus}
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
