-- Supplier ordering system: suppliers, purchase_orders, purchase_order_items
-- Connects machine inventory reorder points to purchase order generation

-- ─── Suppliers ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" uuid NOT NULL REFERENCES "teams"("id"),
  "name" text NOT NULL,
  "contact_name" text,
  "email" text,
  "phone" text,
  "lead_time_days" integer DEFAULT 3,
  "minimum_order_amount" numeric(12, 2) DEFAULT 0,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "suppliers_business_id_idx" ON "suppliers" ("business_id");

ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_policy" ON "suppliers"
  FOR SELECT USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "suppliers_insert_policy" ON "suppliers"
  FOR INSERT WITH CHECK (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "suppliers_update_policy" ON "suppliers"
  FOR UPDATE USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "suppliers_delete_policy" ON "suppliers"
  FOR DELETE USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

-- ─── Purchase Orders ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" uuid NOT NULL REFERENCES "teams"("id"),
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
  "order_number" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "total_amount" numeric(12, 2) NOT NULL DEFAULT 0,
  "notes" text,
  "expected_delivery_date" date,
  "submitted_at" timestamptz,
  "received_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "purchase_orders_business_id_idx" ON "purchase_orders" ("business_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_supplier_id_idx" ON "purchase_orders" ("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders" ("status");

ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select_policy" ON "purchase_orders"
  FOR SELECT USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "purchase_orders_insert_policy" ON "purchase_orders"
  FOR INSERT WITH CHECK (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "purchase_orders_update_policy" ON "purchase_orders"
  FOR UPDATE USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

CREATE POLICY "purchase_orders_delete_policy" ON "purchase_orders"
  FOR DELETE USING (
    "business_id" IN (
      SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
    )
  );

-- ─── Purchase Order Items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "purchase_order_id" uuid NOT NULL REFERENCES "purchase_orders"("id"),
  "sku_id" uuid NOT NULL REFERENCES "skus"("id"),
  "quantity" integer NOT NULL,
  "unit_cost" numeric(10, 2) NOT NULL,
  "total_cost" numeric(12, 2) NOT NULL,
  "received_quantity" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "purchase_order_items_po_id_idx" ON "purchase_order_items" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_items_sku_id_idx" ON "purchase_order_items" ("sku_id");

ALTER TABLE "purchase_order_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_order_items_select_policy" ON "purchase_order_items"
  FOR SELECT USING (
    "purchase_order_id" IN (
      SELECT "id" FROM "purchase_orders" WHERE "business_id" IN (
        SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
      )
    )
  );

CREATE POLICY "purchase_order_items_insert_policy" ON "purchase_order_items"
  FOR INSERT WITH CHECK (
    "purchase_order_id" IN (
      SELECT "id" FROM "purchase_orders" WHERE "business_id" IN (
        SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
      )
    )
  );

CREATE POLICY "purchase_order_items_update_policy" ON "purchase_order_items"
  FOR UPDATE USING (
    "purchase_order_id" IN (
      SELECT "id" FROM "purchase_orders" WHERE "business_id" IN (
        SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
      )
    )
  );

CREATE POLICY "purchase_order_items_delete_policy" ON "purchase_order_items"
  FOR DELETE USING (
    "purchase_order_id" IN (
      SELECT "id" FROM "purchase_orders" WHERE "business_id" IN (
        SELECT "team_id" FROM "users_on_team" WHERE "user_id" = auth.uid()
      )
    )
  );

-- ─── Add supplier_id to skus ─────────────────────────────────────────────────

ALTER TABLE "skus" ADD COLUMN IF NOT EXISTS "supplier_id" uuid REFERENCES "suppliers"("id");

CREATE INDEX IF NOT EXISTS "skus_supplier_id_idx" ON "skus" ("supplier_id") WHERE "supplier_id" IS NOT NULL;
