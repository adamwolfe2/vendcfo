"use client";

import { createClient } from "@vendcfo/supabase/client";
import { Pencil, Plus, Truck } from "lucide-react";
import { useCallback, useState } from "react";
import { SupplierModal } from "./supplier-modal";
import type { SupplierRow, SkuOption } from "./types";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Truck size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No suppliers yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Add your first supplier to start generating purchase orders.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Supplier
      </button>
    </div>
  );
}

interface SuppliersTabProps {
  initialData: SupplierRow[];
  skuList: SkuOption[];
  teamId: string;
}

export function SuppliersTab({
  initialData,
  skuList,
  teamId,
}: SuppliersTabProps) {
  const supabase: any = createClient();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(initialData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SupplierRow | null>(null);

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", teamId)
      .order("name", { ascending: true });
    if (data) setSuppliers(data as SupplierRow[]);
  }, [supabase, teamId]);

  const skuCountBySupplier = skuList.reduce<Record<string, number>>(
    (acc, sku) => {
      if (sku.supplierId) {
        return { ...acc, [sku.supplierId]: (acc[sku.supplierId] ?? 0) + 1 };
      }
      return acc;
    },
    {},
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#888]">
          {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333]"
        >
          <Plus size={16} strokeWidth={1.5} />
          Add Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Phone
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Lead Time
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  SKUs
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
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
                        <Truck size={16} strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-[#111]">
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#666]">
                    {s.contact_name || "--"}
                  </td>
                  <td className="px-4 py-3 text-[#666]">
                    {s.email || "--"}
                  </td>
                  <td className="px-4 py-3 text-[#666]">
                    {s.phone || "--"}
                  </td>
                  <td className="px-4 py-3 text-center text-[#666]">
                    {s.lead_time_days ?? 3}d
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[#555]">
                    {skuCountBySupplier[s.id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        s.is_active
                          ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                          : "bg-[#f0f0f0] text-[#999] border-[#ddd]"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setEditEntry(s)}
                        title="Edit"
                        className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                      >
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <SupplierModal
          mode="add"
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchSuppliers}
        />
      )}
      {editEntry && (
        <SupplierModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchSuppliers}
        />
      )}
    </div>
  );
}
