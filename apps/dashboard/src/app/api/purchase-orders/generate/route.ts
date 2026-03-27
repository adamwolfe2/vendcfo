import { db } from "@vendcfo/db/client";
import {
  machineInventory,
  machines,
  locations,
  skus,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
} from "@vendcfo/db/schema/vending";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { and, eq, sql, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `PO-${datePart}-${rand}`;
}

export async function POST() {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = (await createClient()) as any;

    const { data: userData } = await supabase
      .from("users_on_team")
      .select("team_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .single();

    if (!userData?.team_id) {
      return NextResponse.json(
        { success: false, error: "No team found" },
        { status: 400 },
      );
    }

    const teamId = userData.team_id as string;

    // Find all low-stock items with supplier assignments
    const lowStockItems = await db
      .select({
        inventoryId: machineInventory.id,
        machineId: machineInventory.machine_id,
        skuId: machineInventory.sku_id,
        currentQuantity: machineInventory.current_quantity,
        maxCapacity: machineInventory.max_capacity,
        reorderThreshold: machineInventory.reorder_threshold,
        skuName: skus.name,
        unitCost: skus.unit_cost,
        supplierId: skus.supplier_id,
        machineName: machines.serial_number,
        locationName: locations.name,
      })
      .from(machineInventory)
      .innerJoin(skus, eq(machineInventory.sku_id, skus.id))
      .innerJoin(machines, eq(machineInventory.machine_id, machines.id))
      .innerJoin(locations, eq(machines.location_id, locations.id))
      .where(
        and(
          eq(machineInventory.business_id, teamId),
          sql`${machineInventory.current_quantity} <= ${machineInventory.reorder_threshold}`,
          isNotNull(skus.supplier_id),
        ),
      );

    if (lowStockItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          message: "No low-stock items with assigned suppliers found",
          total: 0,
        },
      });
    }

    // Group by supplier, then aggregate by SKU
    const bySupplier = new Map<
      string,
      Map<
        string,
        {
          skuId: string;
          skuName: string;
          unitCost: string;
          totalNeeded: number;
        }
      >
    >();

    for (const item of lowStockItems) {
      const suppId = item.supplierId as string;
      if (!bySupplier.has(suppId)) {
        bySupplier.set(suppId, new Map());
      }

      const supplierSkus = bySupplier.get(suppId)!;
      const needed = Number(item.maxCapacity) - Number(item.currentQuantity);

      if (supplierSkus.has(item.skuId)) {
        const existing = supplierSkus.get(item.skuId)!;
        supplierSkus.set(item.skuId, {
          ...existing,
          totalNeeded: existing.totalNeeded + needed,
        });
      } else {
        supplierSkus.set(item.skuId, {
          skuId: item.skuId,
          skuName: item.skuName,
          unitCost: item.unitCost,
          totalNeeded: needed,
        });
      }
    }

    // Fetch supplier details for lead time calculation
    const supplierIds = Array.from(bySupplier.keys());
    const supplierRows = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.business_id, teamId),
          sql`${suppliers.id} IN (${sql.join(
            supplierIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )})`,
        ),
      );

    const supplierMap = new Map(supplierRows.map((s) => [s.id, s]));

    // Create purchase orders
    const createdOrders: Array<{
      id: string;
      orderNumber: string;
      supplierName: string;
      totalAmount: string;
      itemCount: number;
      expectedDeliveryDate: string | null;
    }> = [];

    for (const [supplierId, skuMap] of bySupplier) {
      const supplier = supplierMap.get(supplierId);
      if (!supplier) continue;

      const orderNumber = generateOrderNumber();
      const items = Array.from(skuMap.values());

      let totalAmount = 0;
      const lineItems = items.map((item) => {
        const lineCost =
          item.totalNeeded * Number.parseFloat(item.unitCost || "0");
        totalAmount += lineCost;
        return {
          skuId: item.skuId,
          quantity: item.totalNeeded,
          unitCost: item.unitCost,
          totalCost: lineCost.toFixed(2),
        };
      });

      // Calculate expected delivery date from lead time
      const leadDays = supplier.lead_time_days ?? 3;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + leadDays);
      const expectedDateStr = expectedDate.toISOString().split("T")[0] as string;

      // Insert purchase order
      const [newOrder] = await db
        .insert(purchaseOrders)
        .values({
          business_id: teamId,
          supplier_id: supplierId,
          order_number: orderNumber,
          status: "draft",
          total_amount: totalAmount.toFixed(2),
          expected_delivery_date: expectedDateStr,
        })
        .returning();

      if (!newOrder) continue;

      // Insert line items
      await db.insert(purchaseOrderItems).values(
        lineItems.map((li) => ({
          purchase_order_id: newOrder.id,
          sku_id: li.skuId,
          quantity: li.quantity,
          unit_cost: li.unitCost,
          total_cost: li.totalCost,
        })),
      );

      createdOrders.push({
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        supplierName: supplier.name,
        totalAmount: totalAmount.toFixed(2),
        itemCount: lineItems.length,
        expectedDeliveryDate: expectedDateStr,
      });
    }

    return NextResponse.json({
      success: true,
      data: createdOrders,
      meta: {
        total: createdOrders.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate purchase orders",
      },
      { status: 500 },
    );
  }
}
