import {
  boolean,
  date,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { teams, users } from "../schema";
import { locations } from "./vending";

export const revenueRecords = pgTable("revenue_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
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
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const salesTaxRecords = pgTable("sales_tax_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  tax_rate: decimal("tax_rate", { precision: 6, scale: 4 })
    .default("0")
    .notNull(),
  taxable_amount: decimal("taxable_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  tax_amount: decimal("tax_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const revShareAgreements = pgTable("rev_share_agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  location_id: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
  share_percentage: decimal("share_percentage", { precision: 5, scale: 2 })
    .default("0")
    .notNull(),
  effective_date: date("effective_date"),
  contact_name: text("contact_name"),
  contact_email: text("contact_email"),
  notes: text("notes"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const locationGroups = pgTable("location_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  name: text("name").notNull(),
  contact_name: text("contact_name"),
  contact_email: text("contact_email"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const locationGroupMembers = pgTable(
  "location_group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    group_id: uuid("group_id")
      .references(() => locationGroups.id, { onDelete: "cascade" })
      .notNull(),
    location_id: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("unique_group_location").on(table.group_id, table.location_id),
  ],
);

export const generatedReports = pgTable("generated_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .references(() => teams.id)
    .notNull(),
  report_type: text("report_type").notNull(),
  title: text("title").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  location_group_id: uuid("location_group_id").references(
    () => locationGroups.id,
  ),
  employee_id: uuid("employee_id").references(() => users.id),
  report_data: jsonb("report_data").default({}).notNull(),
  email_to: text("email_to"),
  email_subject: text("email_subject"),
  email_body: text("email_body"),
  email_sent_at: timestamp("email_sent_at", { withTimezone: true }),
  status: text("status").default("draft").notNull(),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
