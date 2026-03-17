import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams, users } from '../schema'; // Reference the master Midday schemas

export const routes = pgTable('routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  operator_id: uuid('operator_id').references(() => users.id),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  route_id: uuid('route_id').references(() => routes.id),
  name: text('name').notNull(),
  address: text('address'),
  location_type: text('location_type'), // 'office', 'school', 'gym', 'transit', 'other'
  rev_share_pct: decimal('rev_share_pct', { precision: 5, scale: 2 }),
  rev_share_threshold: decimal('rev_share_threshold', { precision: 12, scale: 2 }),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  monthly_rent: decimal('monthly_rent', { precision: 12, scale: 2 }),
  service_frequency_days: integer('service_frequency_days'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const machines = pgTable('machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  location_id: uuid('location_id').references(() => locations.id).notNull(),
  serial_number: text('serial_number'),
  make_model: text('make_model'),
  machine_type: text('machine_type'), // 'snack', 'beverage', 'combo', 'coffee'
  capacity_slots: integer('capacity_slots'),
  date_acquired: date('date_acquired'),
  purchase_price: decimal('purchase_price', { precision: 12, scale: 2 }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const skus = pgTable('skus', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  category: text('category'), // 'candy', 'chips', 'pastry', 'soda', 'energy_drink', 'water'
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull(),
  retail_price: decimal('retail_price', { precision: 10, scale: 2 }).notNull(),
  target_margin_pct: decimal('target_margin_pct', { precision: 5, scale: 2 }),
  upc_code: text('upc_code'),
  supplier: text('supplier'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const financing = pgTable('financing', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  machine_id: uuid('machine_id').references(() => machines.id).notNull(),
  loan_amount: decimal('loan_amount', { precision: 12, scale: 2 }).notNull(),
  apr: decimal('apr', { precision: 5, scale: 2 }).notNull(),
  term_months: integer('term_months').notNull(),
  start_date: date('start_date').notNull(),
  monthly_payment: decimal('monthly_payment', { precision: 12, scale: 2 }),
  lender_name: text('lender_name'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const serviceLogs = pgTable('service_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  machine_id: uuid('machine_id').references(() => machines.id).notNull(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  service_date: timestamp('service_date', { withTimezone: true }).notNull(),
  notes: text('notes'),
  revenue_collected: decimal('revenue_collected', { precision: 12, scale: 2 }),
  inventory_value_added: decimal('inventory_value_added', { precision: 12, scale: 2 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
