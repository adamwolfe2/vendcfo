import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams } from '@vendcfo/db/schema';

export const skus = pgTable('skus', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  category: text('category'),
  unit_cost: decimal('unit_cost', { precision: 12, scale: 2 }).notNull(),
  retail_price: decimal('retail_price', { precision: 12, scale: 2 }).notNull(),
  target_margin_pct: decimal('target_margin_pct', { precision: 5, scale: 2 }),
  avg_monthly_units: integer('avg_monthly_units'),
  spoilage_pct: decimal('spoilage_pct', { precision: 5, scale: 2 }),
  merchant_fee_pct: decimal('merchant_fee_pct', { precision: 5, scale: 2 }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
