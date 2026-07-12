"use strict";
const { sql } = require("drizzle-orm");
const { pgTable, uuid, varchar, integer, timestamp, jsonb, index, uniqueIndex } = require("drizzle-orm/pg-core");

const authorizationOutboxEvents = pgTable("authorization_outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 140 }).notNull(),
  aggregateType: varchar("aggregate_type", { length: 100 }).notNull(),
  aggregateId: varchar("aggregate_id", { length: 180 }).notNull(),
  eventVersion: varchar("event_version", { length: 80 }).notNull(),
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }),
  subjectLogtoUserId: varchar("subject_logto_user_id", { length: 128 }),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  claimedBy: varchar("claimed_by", { length: 160 }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastErrorJson: jsonb("last_error_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusAvailableIdx: index("authorization_outbox_status_available_idx").on(table.status, table.availableAt),
  orgCreatedIdx: index("authorization_outbox_org_created_idx").on(table.logtoOrganizationId, table.createdAt),
  subjectCreatedIdx: index("authorization_outbox_subject_created_idx").on(table.subjectLogtoUserId, table.createdAt),
  aggregateEventVersionUidx: uniqueIndex("authorization_outbox_event_aggregate_version_uidx").on(table.eventType, table.aggregateType, table.aggregateId, table.eventVersion),
}));

module.exports = { authorizationOutboxEvents };
