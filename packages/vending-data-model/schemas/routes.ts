import { pgTable, uuid, text, boolean, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { teams } from '@vendcfo/db/schema'; // Assuming VendHub uses teams or similar for businesses

export const routes = pgTable('routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  operator_id: uuid('operator_id'), // Could reference a users table later
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
