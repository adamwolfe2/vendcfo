import { SuppliersPage } from "@/components/suppliers/suppliers-page";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import {
  suppliers,
  skus,
  purchaseOrders,
  purchaseOrderItems,
  machineInventory,
  machines,
  locations,
} from "@vendcfo/db/schema/vending";
import { eq, and, sql, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Suppliers & Ordering | VendCFO",
};

export default async function Page() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  let initialSuppliers: any[] = [];
  let initialOrders: any[] = [];
  let initialLowStock: any[] = [];
  let skuList: any[] = [];

  try {
    const [suppliersData, ordersData, lowStockData, skuData] =
      await Promise.all([
        db
          .select()
          .from(suppliers)
          .where(eq(suppliers.business_id, teamId!))
          .orderBy(suppliers.name),
        db
          .select({
            id: purchaseOrders.id,
            orderNumber: purchaseOrders.order_number,
            supplierId: purchaseOrders.supplier_id,
            supplierName: suppliers.name,
            status: purchaseOrders.status,
            totalAmount: purchaseOrders.total_amount,
            expectedDeliveryDate: purchaseOrders.expected_delivery_date,
            submittedAt: purchaseOrders.submitted_at,
            receivedAt: purchaseOrders.received_at,
            notes: purchaseOrders.notes,
            createdAt: purchaseOrders.created_at,
            itemCount: sql<number>`(
              SELECT count(*) FROM purchase_order_items
              WHERE purchase_order_items.purchase_order_id = ${purchaseOrders.id}
            )`,
          })
          .from(purchaseOrders)
          .innerJoin(suppliers, eq(purchaseOrders.supplier_id, suppliers.id))
          .where(eq(purchaseOrders.business_id, teamId!))
          .orderBy(desc(purchaseOrders.created_at)),
        db
          .select({
            inventoryId: machineInventory.id,
            skuId: machineInventory.sku_id,
            skuName: skus.name,
            supplierId: skus.supplier_id,
            supplierName: sql<string>`(
              SELECT s.name FROM suppliers s WHERE s.id = ${skus.supplier_id}
            )`,
            machineSerial: machines.serial_number,
            locationName: locations.name,
            currentQuantity: machineInventory.current_quantity,
            maxCapacity: machineInventory.max_capacity,
            reorderThreshold: machineInventory.reorder_threshold,
            unitCost: skus.unit_cost,
          })
          .from(machineInventory)
          .innerJoin(skus, eq(machineInventory.sku_id, skus.id))
          .innerJoin(machines, eq(machineInventory.machine_id, machines.id))
          .innerJoin(locations, eq(machines.location_id, locations.id))
          .where(
            and(
              eq(machineInventory.business_id, teamId!),
              sql`${machineInventory.current_quantity} <= ${machineInventory.reorder_threshold}`,
            ),
          ),
        db
          .select({
            id: skus.id,
            name: skus.name,
            supplierId: skus.supplier_id,
          })
          .from(skus)
          .where(eq(skus.business_id, teamId!))
          .orderBy(skus.name),
      ]);

    initialSuppliers = suppliersData;
    initialOrders = ordersData;
    initialLowStock = lowStockData;
    skuList = skuData;
  } catch {
    // Tables may not exist yet
  }

  return (
    <SuppliersPage
      initialSuppliers={initialSuppliers}
      initialOrders={initialOrders}
      initialLowStock={initialLowStock}
      skuList={skuList}
      teamId={teamId!}
    />
  );
}
