import { pgTable, uuid, varchar, text, decimal, integer, date, time, timestamp } from 'drizzle-orm/pg-core';

export const barbers = pgTable('barbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  barber_id: uuid('barber_id').references(() => barbers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  downpayment_amount: decimal('downpayment_amount', { precision: 10, scale: 2 }).notNull(),
  duration_mins: integer('duration_mins').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customer_name: varchar('customer_name', { length: 255 }).notNull(),
  customer_phone: varchar('customer_phone', { length: 50 }).notNull(),
  customer_email: varchar('customer_email', { length: 255 }).notNull(),
  barber_id: uuid('barber_id').references(() => barbers.id, { onDelete: 'cascade' }),
  service_id: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }),
  appointment_date: date('appointment_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  management_token: uuid('management_token').defaultRandom().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointment_id: uuid('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  paymongo_checkout_id: varchar('paymongo_checkout_id', { length: 255 }),
  paymongo_payment_id: varchar('paymongo_payment_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  idempotency_key: uuid('idempotency_key').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
