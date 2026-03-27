"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { AlertTriangle, ClipboardList, Truck } from "lucide-react";
import { useState } from "react";
import { PurchaseOrdersTab } from "./purchase-orders-tab";
import { ReorderAlertsTab } from "./reorder-alerts-tab";
import { SuppliersTab } from "./suppliers-tab";
import type {
  LowStockItem,
  PurchaseOrderRow,
  SkuOption,
  SupplierRow,
} from "./types";

const TABS = [
  { id: "suppliers", label: "Suppliers", Icon: Truck },
  { id: "orders", label: "Purchase Orders", Icon: ClipboardList },
  { id: "alerts", label: "Reorder Alerts", Icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SuppliersPageProps {
  initialSuppliers: SupplierRow[];
  initialOrders: PurchaseOrderRow[];
  initialLowStock: LowStockItem[];
  skuList: SkuOption[];
  teamId: string;
}

export function SuppliersPage({
  initialSuppliers,
  initialOrders,
  initialLowStock,
  skuList,
  teamId,
}: SuppliersPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("suppliers");

  const alertCount = initialLowStock.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Suppliers & Ordering
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage suppliers, generate purchase orders, and track reorder
            alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AskRouteCFO prompt="Analyze my supplier costs and ordering patterns. Are there opportunities to consolidate orders or negotiate better pricing?" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-lg border border-[#e0e0e0] bg-[#fafafa] p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 min-h-[44px] text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === id
                ? "bg-white text-[#111] shadow-sm border border-[#e0e0e0]"
                : "text-[#888] hover:text-[#555]"
            }`}
          >
            <Icon size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">{label}</span>
            {id === "alerts" && alertCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "suppliers" && (
        <SuppliersTab
          initialData={initialSuppliers}
          skuList={skuList}
          teamId={teamId}
        />
      )}
      {activeTab === "orders" && (
        <PurchaseOrdersTab initialData={initialOrders} teamId={teamId} />
      )}
      {activeTab === "alerts" && (
        <ReorderAlertsTab initialData={initialLowStock} />
      )}
    </div>
  );
}
