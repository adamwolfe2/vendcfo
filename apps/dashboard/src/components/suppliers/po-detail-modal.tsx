"use client";

import { createClient } from "@vendcfo/supabase/client";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PurchaseOrderRow, PurchaseOrderItemRow } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

interface PODetailModalProps {
  order: PurchaseOrderRow;
  onClose: () => void;
  onStatusChange: () => void;
}

export function PODetailModal({
  order,
  onClose,
  onStatusChange,
}: PODetailModalProps) {
  const supabase: any = createClient();
  const [items, setItems] = useState<PurchaseOrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from("purchase_order_items")
        .select(
          `
          id,
          sku_id,
          quantity,
          unit_cost,
          total_cost,
          received_quantity,
          skus (name)
        `,
        )
        .eq("purchase_order_id", order.id);

      if (data) {
        setItems(
          (data as any[]).map((d) => ({
            id: d.id,
            skuId: d.sku_id,
            skuName: d.skus?.name ?? "Unknown",
            quantity: d.quantity,
            unitCost: d.unit_cost,
            totalCost: d.total_cost,
            receivedQuantity: d.received_quantity,
          })),
        );
      }
      setLoading(false);
    }
    fetchItems();
  }, [supabase, order.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const updates: Record<string, any> = { status: newStatus };

    if (newStatus === "submitted") {
      updates.submitted_at = new Date().toISOString();
    } else if (newStatus === "received") {
      updates.received_at = new Date().toISOString();
    }

    await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", order.id);

    setUpdating(false);
    onStatusChange();
    onClose();
  };

  const statusBadge = STATUS_COLORS[order.status] ?? STATUS_COLORS.draft;
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-2xl rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111]">
              {order.orderNumber}
            </h2>
            <p className="text-sm text-[#888]">{order.supplierName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:text-[#333]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge}`}
          >
            {statusLabel}
          </span>
          <span className="text-sm text-[#888]">
            Total: ${Number(order.totalAmount).toFixed(2)}
          </span>
          {order.expectedDeliveryDate && (
            <span className="text-sm text-[#888]">
              Expected:{" "}
              {new Date(order.expectedDeliveryDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {order.notes && (
          <p className="mb-4 text-sm text-[#666] italic">{order.notes}</p>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded border border-[#e0e0e0] bg-[#f5f5f5]"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-2 text-left font-medium text-[#555]">
                    Product
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-[#555]">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-[#555]">
                    Unit Cost
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-[#555]">
                    Line Total
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-[#555]">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#f0f0f0] last:border-0"
                  >
                    <td className="px-4 py-2 font-medium text-[#111]">
                      {item.skuName}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#555]">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#555]">
                      ${Number(item.unitCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#555]">
                      ${Number(item.totalCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#555]">
                      {item.receivedQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
          {order.status === "draft" && (
            <>
              <button
                type="button"
                onClick={() => updateStatus("canceled")}
                disabled={updating}
                className="rounded-md border border-red-200 bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 w-full sm:w-auto"
              >
                Cancel Order
              </button>
              <button
                type="button"
                onClick={() => updateStatus("submitted")}
                disabled={updating}
                className="rounded-md bg-[#2563eb] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50 w-full sm:w-auto"
              >
                {updating ? "Submitting..." : "Submit Order"}
              </button>
            </>
          )}
          {(order.status === "submitted" || order.status === "confirmed" || order.status === "shipped") && (
            <>
              <button
                type="button"
                onClick={() => updateStatus("canceled")}
                disabled={updating}
                className="rounded-md border border-red-200 bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 w-full sm:w-auto"
              >
                Cancel Order
              </button>
              <button
                type="button"
                onClick={() => updateStatus("received")}
                disabled={updating}
                className="rounded-md bg-[#059669] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#047857] disabled:opacity-50 w-full sm:w-auto"
              >
                {updating ? "Updating..." : "Mark Received"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
