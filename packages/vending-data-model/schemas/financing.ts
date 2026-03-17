import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams } from '@vendcfo/db/schema';
import { machines } from './machines';
import { skus } from './skus';

export const machine_skus = pgTable('machine_skus', {
  machine_id: uuid('machine_id').references(() => machines.id).notNull(),
  sku_id: uuid('sku_id').references(() => skus.id).notNull(),
  slot_number: integer('slot_number'),
  par_level: integer('par_level'),
  avg_units_per_service: integer('avg_units_per_service'),
});

export const financing_obligations = pgTable('financing_obligations', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  machine_id: uuid('machine_id').references(() => machines.id),
  lender: text('lender'),
  principal: decimal('principal', { precision: 12, scale: 2 }).notNull(),
  apr: decimal('apr', { precision: 5, scale: 2 }).notNull(),
  term_months: integer('term_months').notNull(),
  monthly_payment: decimal('monthly_payment', { precision: 12, scale: 2 }).notNull(),
  start_date: date('start_date'),
  remaining_balance: decimal('remaining_balance', { precision: 12, scale: 2 }),
});

export const service_logs = pgTable('service_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  machine_id: uuid('machine_id').references(() => machines.id).notNull(),
  operator_id: uuid('operator_id'),
  service_date: date('service_date').notNull(),
  travel_time_mins: integer('travel_time_mins'),
  service_time_mins: integer('service_time_mins'),
  fuel_cost: decimal('fuel_cost', { precision: 12, scale: 2 }),
  notes: text('notes'),
});
