"use client";

import { createClient } from "@vendcfo/supabase/client";
import { Package, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InventoryRow {
  id: string;
  machine_id: string;
  sku_id: string;
  current_quantity: number;
  max_capacity: number;
  last_restocked_at: string | null;
  reorder_threshold: number;
  skus: { name: string; category: string | null } | null;
}

type InventoryStatus = "Good" | "Low Stock" | "Needs Restock";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFillPct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((current / max) * 100);
}

function getStatus(fillPct: number): InventoryStatus {
  if (fillPct > 50) return "Good";
  if (fillPct >= 20) return "Low Stock";
  return "Needs Restock";
}

function getStatusStyle(status: InventoryStatus): string {
  switch (status) {
    case "Good":
      return "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    case "Low Stock":
      return "bg-[#fffbeb] text-[#d97706] border-[#fde68a]";
    case "Needs Restock":
      return "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]";
  }
}

function getBarColor(status: InventoryStatus): string {
  switch (status) {
    case "Good":
      return "bg-[#059669]";
    case "Low Stock":
      return "bg-[#d97706]";
    case "Needs Restock":
      return "bg-[#dc2626]";
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "--";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MachineInventoryDetail({
  machineId,
  machineLabel,
  onClose,
}: {
  machineId: string;
  machineLabel: string;
  onClose: () => void;
}) {
  const supabase: any = createClient();
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("machine_inventory")
      .select("*, skus(name, category)")
      .eq("machine_id", machineId)
      .order("current_quantity", { ascending: true });
    if (data) setInventory(data as InventoryRow[]);
    setLoading(false);
  }, [supabase, machineId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRestock = async (item: InventoryRow) => {
    setRestocking(item.id);
    const { error } = await supabase
      .from("machine_inventory")
      .update({
        current_quantity: item.max_capacity,
        last_restocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (!error) {
      setInventory((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                current_quantity: item.max_capacity,
                last_restocked_at: new Date().toISOString(),
              }
            : row,
        ),
      );
    }
    setRestocking(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-2xl rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111]">
              Machine Inventory
            </h2>
            <p className="text-sm text-[#888] mt-0.5">{machineLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:text-[#333]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
              />
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-12 px-6 text-center">
            <Package
              size={32}
              strokeWidth={1.5}
              className="mb-3 text-[#bbb]"
            />
            <p className="text-sm font-medium text-[#555]">
              No inventory tracked
            </p>
            <p className="mt-1 text-xs text-[#999]">
              This machine has no inventory records yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-3 text-left font-medium text-[#555]">
                    Product
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-[#555]">
                    Qty
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-[#555] hidden sm:table-cell">
                    Max
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-[#555] min-w-[120px]">
                    Fill %
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-[#555] hidden sm:table-cell">
                    Restocked
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-[#555]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-[#555]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const fillPct = getFillPct(
                    item.current_quantity,
                    item.max_capacity,
                  );
                  const status = getStatus(fillPct);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[#f0f0f0] last:border-0 transition-colors hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#111]">
                          {item.skus?.name ?? "Unknown"}
                        </div>
                        {item.skus?.category && (
                          <div className="text-xs text-[#888] capitalize">
                            {item.skus.category}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-[#555]">
                        {item.current_quantity}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-[#555] hidden sm:table-cell">
                        {item.max_capacity}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getBarColor(status)}`}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-[#888] w-8 text-right shrink-0">
                            {fillPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-[#888] hidden sm:table-cell">
                        {formatTimeAgo(item.last_restocked_at)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestock(item)}
                          disabled={
                            restocking === item.id ||
                            item.current_quantity === item.max_capacity
                          }
                          title="Mark Restocked"
                          className="inline-flex items-center gap-1 rounded-md border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <RefreshCw
                            size={12}
                            strokeWidth={1.5}
                            className={
                              restocking === item.id ? "animate-spin" : ""
                            }
                          />
                          <span className="hidden sm:inline">Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && inventory.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#888]">
            <span>{inventory.length} products tracked</span>
            <span>
              {
                inventory.filter(
                  (i) => i.current_quantity <= i.reorder_threshold,
                ).length
              }{" "}
              need restock
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
