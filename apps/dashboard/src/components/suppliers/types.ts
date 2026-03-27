export interface SupplierRow {
  id: string;
  business_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  lead_time_days: number | null;
  minimum_order_amount: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderRow {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: string;
  expectedDeliveryDate: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  itemCount: number;
}

export interface LowStockItem {
  inventoryId: string;
  skuId: string;
  skuName: string;
  supplierId: string | null;
  supplierName: string | null;
  machineSerial: string | null;
  locationName: string;
  currentQuantity: number;
  maxCapacity: number;
  reorderThreshold: number | null;
  unitCost: string;
}

export interface SkuOption {
  id: string;
  name: string;
  supplierId: string | null;
}

export interface PurchaseOrderItemRow {
  id: string;
  skuId: string;
  skuName: string;
  quantity: number;
  unitCost: string;
  totalCost: string;
  receivedQuantity: number;
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f0f0f0] text-[#666] border-[#ddd]",
  submitted: "bg-[#eef6ff] text-[#2563eb] border-[#bfdbfe]",
  confirmed: "bg-[#fef9c3] text-[#a16207] border-[#fde68a]",
  shipped: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  received: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  canceled: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  confirmed: "Confirmed",
  shipped: "Shipped",
  received: "Received",
  canceled: "Canceled",
};
