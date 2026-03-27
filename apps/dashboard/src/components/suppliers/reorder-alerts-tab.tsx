"use client";

import { AlertTriangle, Package, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { LowStockItem } from "./types";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <Package size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">
        No low-stock items right now
      </p>
      <p className="mt-1 text-xs text-[#999]">
        Items will appear here when they hit their reorder threshold.
      </p>
    </div>
  );
}

interface ReorderAlertsTabProps {
  initialData: LowStockItem[];
}

export function ReorderAlertsTab({ initialData }: ReorderAlertsTabProps) {
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Group by supplier
  const grouped = initialData.reduce<
    Record<string, { supplierName: string; items: LowStockItem[] }>
  >((acc, item) => {
    const key = item.supplierId ?? "unassigned";
    const supplierName = item.supplierName ?? "Unassigned";
    if (!acc[key]) {
      return { ...acc, [key]: { supplierName, items: [item] } };
    }
    return {
      ...acc,
      [key]: {
        ...acc[key],
        items: [...acc[key].items, item],
      },
    };
  }, {});

  const supplierGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return grouped[a]!.supplierName.localeCompare(grouped[b]!.supplierName);
  });

  const handleCreatePO = async () => {
    setCreating(true);
    setResult(null);

    try {
      const response = await fetch("/api/purchase-orders/generate", {
        method: "POST",
      });
      const json = await response.json();

      if (json.success) {
        const count = json.data?.length ?? 0;
        setResult(
          count > 0
            ? `Created ${count} draft PO${count !== 1 ? "s" : ""} -- check Purchase Orders tab`
            : "No items with assigned suppliers to create POs for",
        );
      } else {
        setResult(`Error: ${json.error}`);
      }
    } catch {
      setResult("Failed to generate orders");
    }

    setCreating(false);
  };

  if (initialData.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            strokeWidth={1.5}
            className="text-amber-500"
          />
          <p className="text-sm text-[#888]">
            {initialData.length} item{initialData.length !== 1 ? "s" : ""}{" "}
            below reorder threshold
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {result && (
            <span className="text-xs text-[#888] mr-2">{result}</span>
          )}
          <button
            type="button"
            onClick={handleCreatePO}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            {creating ? (
              <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Package size={16} strokeWidth={1.5} />
            )}
            {creating ? "Creating..." : "Create POs from All"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {supplierGroups.map(([key, group]) => {
          const totalNeeded = group.items.reduce(
            (sum, item) =>
              sum + (Number(item.maxCapacity) - Number(item.currentQuantity)),
            0,
          );
          const totalCost = group.items.reduce(
            (sum, item) =>
              sum +
              (Number(item.maxCapacity) - Number(item.currentQuantity)) *
                Number(item.unitCost || 0),
            0,
          );

          return (
            <div
              key={key}
              className="rounded-lg border border-[#e0e0e0] bg-white"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#e0e0e0] bg-[#fafafa] px-4 py-3 rounded-t-lg">
                <div>
                  <h3 className="font-semibold text-[#111]">
                    {group.supplierName}
                  </h3>
                  <p className="text-xs text-[#888]">
                    {group.items.length} item{group.items.length !== 1 ? "s" : ""}{" "}
                    -- {totalNeeded} units needed -- ~${totalCost.toFixed(2)}
                  </p>
                </div>
                {key === "unassigned" && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Assign suppliers to SKUs to enable auto-ordering
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0f0f0]">
                      <th className="px-4 py-2 text-left font-medium text-[#555]">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-[#555]">
                        Machine
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-[#555]">
                        Location
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-[#555]">
                        Current
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-[#555]">
                        Threshold
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-[#555]">
                        Needed
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-[#555]">
                        Est. Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => {
                      const needed =
                        Number(item.maxCapacity) -
                        Number(item.currentQuantity);
                      const estCost = needed * Number(item.unitCost || 0);
                      const isZero = Number(item.currentQuantity) === 0;

                      return (
                        <tr
                          key={item.inventoryId}
                          className="border-b border-[#f0f0f0] last:border-0"
                        >
                          <td className="px-4 py-2 font-medium text-[#111]">
                            {item.skuName}
                          </td>
                          <td className="px-4 py-2 text-[#666] font-mono text-xs">
                            {item.machineSerial || "--"}
                          </td>
                          <td className="px-4 py-2 text-[#666]">
                            {item.locationName}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`font-mono font-medium ${isZero ? "text-red-600" : "text-amber-600"}`}
                            >
                              {Number(item.currentQuantity)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center font-mono text-[#888]">
                            {Number(item.reorderThreshold ?? 2)}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-medium text-[#111]">
                            {needed}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-[#555]">
                            ${estCost.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
