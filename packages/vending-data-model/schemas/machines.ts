import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams } from '@vendcfo/db/schema';
import { locations } from './locations';

export const machines = pgTable('machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  location_id: uuid('location_id').references(() => locations.id),
  name: text('name').notNull(),
  serial_number: text('serial_number'),
  machine_type: text('machine_type'),
  purchase_price: decimal('purchase_price', { precision: 12, scale: 2 }),
  purchase_date: date('purchase_date'),
  financing_id: uuid('financing_id'), // Circular ref avoided, defined in financing
  monthly_financing_payment: decimal('monthly_financing_payment', { precision: 12, scale: 2 }),
  capacity_slots: integer('capacity_slots'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
