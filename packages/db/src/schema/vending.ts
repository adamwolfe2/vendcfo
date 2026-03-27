import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { teams, users } from "../schema"; // Reference the master Midday schemas

export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  operator_id: uuid("operator_id").references(() => users.id),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  route_id: uuid("route_id").references(() => routes.id),
  name: text("name").notNull(),
  address: text("address"),
  location_type: text("location_type"), // 'office', 'school', 'gym', 'transit', 'other'
  rev_share_pct: decimal("rev_share_pct", { precision: 5, scale: 2 }),
  rev_share_threshold: decimal("rev_share_threshold", {
    precision: 12,
    scale: 2,
  }),
  contact_name: text("contact_name"),
  contact_email: text("contact_email"),
  monthly_rent: decimal("monthly_rent", { precision: 12, scale: 2 }),
  service_frequency_days: integer("service_frequency_days"),
  stock_hours: decimal("stock_hours", { precision: 5, scale: 2 }),
  pick_hours: decimal("pick_hours", { precision: 5, scale: 2 }),
  machine_count: integer("machine_count"),
  machine_type_label: text("machine_type_label"),
  software_web: text("software_web"),
  software_type: text("software_type"),
  access_hours: text("access_hours"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const machines = pgTable("machines", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
  serial_number: text("serial_number"),
  make_model: text("make_model"),
  machine_type: text("machine_type"), // 'snack', 'beverage', 'combo', 'coffee'
  capacity_slots: integer("capacity_slots"),
  date_acquired: date("date_acquired"),
  purchase_price: decimal("purchase_price", { precision: 12, scale: 2 }),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const skus = pgTable("skus", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  name: text("name").notNull(),
  category: text("category"), // 'candy', 'chips', 'pastry', 'soda', 'energy_drink', 'water'
  unit_cost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  retail_price: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  target_margin_pct: decimal("target_margin_pct", { precision: 5, scale: 2 }),
  upc_code: text("upc_code"),
  supplier: text("supplier"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const financing = pgTable("financing", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  machine_id: uuid("machine_id")
    .references(() => machines.id)
    .notNull(),
  loan_amount: decimal("loan_amount", { precision: 12, scale: 2 }).notNull(),
  apr: decimal("apr", { precision: 5, scale: 2 }).notNull(),
  term_months: integer("term_months").notNull(),
  start_date: date("start_date").notNull(),
  monthly_payment: decimal("monthly_payment", { precision: 12, scale: 2 }),
  lender_name: text("lender_name"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const serviceSchedule = pgTable("service_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
  day_of_week: smallint("day_of_week").notNull(), // 0=Mon, 5=Sat
  action: text("action").notNull(), // 'pick', 'stock', 'pick_stock', 'nothing'
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const operatorWeeklyPlan = pgTable("operator_weekly_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  operator_id: uuid("operator_id")
    .references(() => users.id)
    .notNull(),
  week_start: date("week_start").notNull(),
  day_of_week: smallint("day_of_week").notNull(), // 0=Mon, 5=Sat
  planned_stops: integer("planned_stops"),
  planned_driving_hrs: decimal("planned_driving_hrs", {
    precision: 5,
    scale: 2,
  }),
  planned_gas_tolls_hrs: decimal("planned_gas_tolls_hrs", {
    precision: 5,
    scale: 2,
  }),
  planned_warehouse_hrs: decimal("planned_warehouse_hrs", {
    precision: 5,
    scale: 2,
  }),
  planned_load_van_hrs: decimal("planned_load_van_hrs", {
    precision: 5,
    scale: 2,
  }),
  planned_stock_hrs: decimal("planned_stock_hrs", {
    precision: 5,
    scale: 2,
  }),
  planned_pick_hrs: decimal("planned_pick_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_stops: integer("actual_stops"),
  actual_driving_hrs: decimal("actual_driving_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_gas_tolls_hrs: decimal("actual_gas_tolls_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_warehouse_hrs: decimal("actual_warehouse_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_load_van_hrs: decimal("actual_load_van_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_stock_hrs: decimal("actual_stock_hrs", {
    precision: 5,
    scale: 2,
  }),
  actual_pick_hrs: decimal("actual_pick_hrs", {
    precision: 5,
    scale: 2,
  }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const operatorRates = pgTable("operator_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  operator_id: uuid("operator_id")
    .references(() => users.id)
    .notNull(),
  hourly_rate: decimal("hourly_rate", { precision: 8, scale: 2 })
    .default("25.00")
    .notNull(),
  gas_rate_per_hr: decimal("gas_rate_per_hr", { precision: 8, scale: 2 })
    .default("0.00")
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const serviceLogs = pgTable("service_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  machine_id: uuid("machine_id")
    .references(() => machines.id)
    .notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  service_date: timestamp("service_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  revenue_collected: decimal("revenue_collected", { precision: 12, scale: 2 }),
  inventory_value_added: decimal("inventory_value_added", {
    precision: 12,
    scale: 2,
  }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  user_id: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  employment_type: text("employment_type").default("w2").notNull(),
  max_weekly_hours: decimal("max_weekly_hours", { precision: 5, scale: 2 })
    .default("40")
    .notNull(),
  hourly_rate: decimal("hourly_rate", { precision: 8, scale: 2 })
    .default("25.00")
    .notNull(),
  hire_date: date("hire_date"),
  is_active: boolean("is_active").default(true).notNull(),
  bank_routing_number: text("bank_routing_number"),
  bank_account_number: text("bank_account_number"),
  bank_account_type: text("bank_account_type").default("checking"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const compensationPlans = pgTable("compensation_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  employee_id: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),
  name: text("name").notNull(),
  pay_model: text("pay_model").default("hourly").notNull(),
  hourly_rate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  per_machine_rate: decimal("per_machine_rate", { precision: 8, scale: 2 }),
  per_stop_rate: decimal("per_stop_rate", { precision: 8, scale: 2 }),
  revenue_share_pct: decimal("revenue_share_pct", { precision: 5, scale: 2 }),
  effective_from: date("effective_from").defaultNow().notNull(),
  effective_to: date("effective_to"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const revenueRecords = pgTable("revenue_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id").references(() => locations.id),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  gross_revenue: decimal("gross_revenue", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  processing_fees: decimal("processing_fees", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  net_deposited: decimal("net_deposited", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  cash_revenue: decimal("cash_revenue", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  card_revenue: decimal("card_revenue", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  transaction_count: integer("transaction_count").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const machineInventory = pgTable("machine_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  machine_id: uuid("machine_id")
    .references(() => machines.id)
    .notNull(),
  sku_id: uuid("sku_id")
    .references(() => skus.id)
    .notNull(),
  current_quantity: integer("current_quantity").notNull().default(0),
  max_capacity: integer("max_capacity").notNull().default(10),
  last_restocked_at: timestamp("last_restocked_at", { withTimezone: true }),
  reorder_threshold: integer("reorder_threshold").default(2),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const capacityAlerts = pgTable("capacity_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  employee_id: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),
  alert_type: text("alert_type").notNull(),
  message: text("message").notNull(),
  current_utilization: decimal("current_utilization", {
    precision: 5,
    scale: 2,
  }).notNull(),
  threshold: decimal("threshold", { precision: 5, scale: 2 })
    .default("85")
    .notNull(),
  is_dismissed: boolean("is_dismissed").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
