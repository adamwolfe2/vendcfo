"use client";

import { createClient } from "@vendcfo/supabase/client";
import { ClipboardList, Eye, Package, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { PODetailModal } from "./po-detail-modal";
import type { PurchaseOrderRow } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <ClipboardList
        size={40}
        strokeWidth={1.5}
        className="mb-4 text-[#bbb]"
      />
      <p className="text-sm font-medium text-[#555]">No purchase orders yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Generate orders from low-stock items or create them manually.
      </p>
    </div>
  );
}

interface PurchaseOrdersTabProps {
  initialData: PurchaseOrderRow[];
  teamId: string;
}

export function PurchaseOrdersTab({
  initialData,
  teamId,
}: PurchaseOrdersTabProps) {
  const supabase: any = createClient();
  const [orders, setOrders] = useState<PurchaseOrderRow[]>(initialData);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrderRow | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("purchase_orders")
      .select(
        `
        id,
        order_number,
        supplier_id,
        status,
        total_amount,
        expected_delivery_date,
        submitted_at,
        received_at,
        notes,
        created_at,
        suppliers (name)
      `,
      )
      .eq("business_id", teamId)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(
        (data as any[]).map((d) => ({
          id: d.id,
          orderNumber: d.order_number,
          supplierId: d.supplier_id,
          supplierName: d.suppliers?.name ?? "Unknown",
          status: d.status,
          totalAmount: d.total_amount,
          expectedDeliveryDate: d.expected_delivery_date,
          submittedAt: d.submitted_at,
          receivedAt: d.received_at,
          notes: d.notes,
          createdAt: d.created_at,
          itemCount: 0,
        })),
      );
    }
  }, [supabase, teamId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);

    try {
      const response = await fetch("/api/purchase-orders/generate", {
        method: "POST",
      });
      const json = await response.json();

      if (json.success) {
        const count = json.data?.length ?? 0;
        setGenResult(
          count > 0
            ? `Created ${count} draft order${count !== 1 ? "s" : ""}`
            : "No low-stock items with assigned suppliers",
        );
        if (count > 0) {
          await fetchOrders();
        }
      } else {
        setGenResult(`Error: ${json.error}`);
      }
    } catch {
      setGenResult("Failed to generate orders");
    }

    setGenerating(false);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-[#888]">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {genResult && (
            <span className="text-xs text-[#888] mr-2">{genResult}</span>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            {generating ? (
              <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Package size={16} strokeWidth={1.5} />
            )}
            {generating ? "Generating..." : "Generate Orders"}
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Order #
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Supplier
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-medium text-[#555]">
                  Items
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Expected
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#555]">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-[#555]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const statusBadge =
                  STATUS_COLORS[o.status] ?? STATUS_COLORS.draft;
                const statusLabel = STATUS_LABELS[o.status] ?? o.status;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-[#f0f0f0] transition-colors hover:bg-[#fafafa] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#111]">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {o.supplierName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[#555]">
                      {Number(o.itemCount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#555]">
                      ${Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {o.expectedDeliveryDate
                        ? new Date(
                            o.expectedDeliveryDate,
                          ).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-[#888] text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setDetailOrder(o)}
                          title="View Details"
                          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
                        >
                          <Eye size={16} strokeWidth={1.5} />
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

      {detailOrder && (
        <PODetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={fetchOrders}
        />
      )}
    </div>
  );
}
