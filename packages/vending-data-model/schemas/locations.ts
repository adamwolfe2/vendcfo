import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams } from '@vendcfo/db/schema';
import { routes } from './routes';

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
