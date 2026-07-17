import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  date,
  time,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    password_hash: text("password_hash").notNull(),
    role: varchar("role", { length: 50 }).default("user").notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("users_role_idx").on(table.role)],
);

export const barbers = pgTable(
  "barbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 50 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("barbers_user_id_idx").on(table.user_id),
    index("barbers_is_active_idx").on(table.is_active),
  ],
);

export const auth_sessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ip_address: varchar("ip_address", { length: 45 }),
    user_agent: text("user_agent"),
    is_valid: boolean("is_valid").default(true).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("auth_sessions_user_id_idx").on(table.user_id)],
);

export const refresh_tokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    session_id: uuid("session_id").references(() => auth_sessions.id, {
      onDelete: "cascade",
    }),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").unique().notNull(),
    is_revoked: boolean("is_revoked").default(false).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.user_id),
    index("refresh_tokens_session_id_idx").on(table.session_id),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barber_id: uuid("barber_id").references(() => barbers.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    downpayment_amount: decimal("downpayment_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    duration_mins: integer("duration_mins").notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("services_barber_id_idx").on(table.barber_id),
    index("services_is_active_idx").on(table.is_active),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customer_name: varchar("customer_name", { length: 255 }).notNull(),
    customer_phone: varchar("customer_phone", { length: 50 }).notNull(),
    customer_email: varchar("customer_email", { length: 255 }).notNull(),
    barber_id: uuid("barber_id").references(() => barbers.id, {
      onDelete: "cascade",
    }),
    service_id: uuid("service_id").references(() => services.id, {
      onDelete: "cascade",
    }),
    appointment_date: date("appointment_date").notNull(),
    start_time: time("start_time").notNull(),
    end_time: time("end_time").notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    management_token: uuid("management_token").defaultRandom().notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "appointments_status_check",
      sql`${table.status} IN ('pending','confirmed','checked_in','completed','no_show','cancelled')`,
    ),
    index("appointments_barber_date_idx").on(
      table.barber_id,
      table.appointment_date,
    ),
    index("appointments_user_id_idx").on(table.user_id),
    index("appointments_status_idx").on(table.status),
    uniqueIndex("appointments_management_token_idx").on(table.management_token),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointment_id: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "cascade",
    }),
    paymongo_checkout_id: varchar("paymongo_checkout_id", { length: 255 }),
    paymongo_payment_id: varchar("paymongo_payment_id", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    idempotency_key: uuid("idempotency_key").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("payments_appointment_id_idx").on(table.appointment_id),
    index("payments_paymongo_checkout_idx").on(table.paymongo_checkout_id),
    uniqueIndex("payments_idempotency_key_idx").on(table.idempotency_key),
  ],
);

export const barber_invitations = pgTable(
  "barber_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    token_hash: text("token_hash").unique().notNull(),
    invited_by: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    accepted_at: timestamp("accepted_at", { withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("barber_invitations_email_idx").on(table.email)],
);

export const barber_working_hours = pgTable(
  "barber_working_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barber_id: uuid("barber_id")
      .references(() => barbers.id, { onDelete: "cascade" })
      .notNull(),
    weekday: integer("weekday").notNull(),
    start_time: time("start_time").notNull(),
    end_time: time("end_time").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("barber_working_hours_slot_idx").on(
      table.barber_id,
      table.weekday,
      table.start_time,
      table.end_time,
    ),
  ],
);

export const barber_availability_blocks = pgTable(
  "barber_availability_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barber_id: uuid("barber_id")
      .references(() => barbers.id, { onDelete: "cascade" })
      .notNull(),
    block_date: date("block_date").notNull(),
    start_time: time("start_time").notNull(),
    end_time: time("end_time").notNull(),
    reason: varchar("reason", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("barber_blocks_barber_date_idx").on(
      table.barber_id,
      table.block_date,
    ),
  ],
);
