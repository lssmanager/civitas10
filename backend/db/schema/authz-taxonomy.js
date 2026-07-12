"use strict";
const { sql } = require("drizzle-orm");
const { pgTable, uuid, varchar, text, boolean, timestamp, bigint, integer, jsonb, uniqueIndex, index } = require("drizzle-orm/pg-core");

const taxonomyTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const taxonomyDimensionDefinitions = pgTable("taxonomy_dimension_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  dimensionKey: varchar("dimension_key", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  description: text("description"),
  valueKind: varchar("value_kind", { length: 40 }).notNull(),
  hierarchyAllowed: boolean("hierarchy_allowed").notNull().default(false),
  multiAssignmentAllowed: boolean("multi_assignment_allowed").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  contractVersion: varchar("contract_version", { length: 80 }).notNull(),
  ...taxonomyTimestamps,
}, (table) => ({
  dimensionKeyIdx: uniqueIndex("taxonomy_dimension_definitions_key_uidx").on(table.dimensionKey),
  activeIdx: index("taxonomy_dimension_definitions_active_idx").on(table.isActive),
}));

const taxonomyDimensionCapabilities = pgTable("taxonomy_dimension_capabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  dimensionDefinitionId: uuid("dimension_definition_id").notNull().references(() => taxonomyDimensionDefinitions.id, { onDelete: "cascade" }),
  capability: varchar("capability", { length: 80 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...taxonomyTimestamps,
}, (table) => ({
  uniqueDefinitionCapability: uniqueIndex("taxonomy_dimension_capabilities_def_cap_uidx").on(table.dimensionDefinitionId, table.capability),
  capabilityIdx: index("taxonomy_dimension_capabilities_capability_idx").on(table.capability, table.isActive),
}));

const organizationDimensionValues = pgTable("organization_dimension_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).notNull(),
  dimensionDefinitionId: uuid("dimension_definition_id").notNull().references(() => taxonomyDimensionDefinitions.id, { onDelete: "restrict" }),
  dimensionKeyCache: varchar("dimension_key_cache", { length: 100 }).notNull(),
  stableKey: varchar("stable_key", { length: 120 }).notNull(),
  displayName: varchar("display_name", { length: 180 }).notNull(),
  description: text("description"),
  parentValueId: uuid("parent_value_id"),
  externalRef: varchar("external_ref", { length: 180 }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdByLogtoUserId: varchar("created_by_logto_user_id", { length: 128 }).notNull(),
  updatedByLogtoUserId: varchar("updated_by_logto_user_id", { length: 128 }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedByLogtoUserId: varchar("published_by_logto_user_id", { length: 128 }),
  deprecatedAt: timestamp("deprecated_at", { withTimezone: true }),
  deprecatedUntil: timestamp("deprecated_until", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archivedByLogtoUserId: varchar("archived_by_logto_user_id", { length: 128 }),
  ...taxonomyTimestamps,
}, (table) => ({
  uniqueOrgDefinitionStableKey: uniqueIndex("organization_dimension_values_org_def_stable_uidx").on(table.logtoOrganizationId, table.dimensionDefinitionId, table.stableKey),
  orgDefinitionStatusIdx: index("organization_dimension_values_org_def_status_idx").on(table.logtoOrganizationId, table.dimensionDefinitionId, table.status),
  orgDimensionStatusIdx: index("organization_dimension_values_org_dim_status_idx").on(table.logtoOrganizationId, table.dimensionKeyCache, table.status),
  parentIdx: index("organization_dimension_values_parent_idx").on(table.parentValueId),
  externalRefIdx: index("organization_dimension_values_external_ref_idx").on(table.logtoOrganizationId, table.dimensionDefinitionId, table.externalRef),
  orgStatusSortIdx: index("organization_dimension_values_org_status_sort_idx").on(table.logtoOrganizationId, table.status, table.sortOrder),
}));

const organizationTaxonomyState = pgTable("organization_taxonomy_state", {
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).primaryKey(),
  taxonomyCatalogVersion: bigint("taxonomy_catalog_version", { mode: "number" }).notNull().default(sql`0`),
  publishedVersion: bigint("published_version", { mode: "number" }).notNull().default(sql`0`),
  status: varchar("status", { length: 40 }).notNull().default("draft"),
  lastPublishedAt: timestamp("last_published_at", { withTimezone: true }),
  lastPublishedByLogtoUserId: varchar("last_published_by_logto_user_id", { length: 128 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const taxonomyPresets = pgTable("taxonomy_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  presetKey: varchar("preset_key", { length: 100 }).notNull(),
  version: varchar("version", { length: 80 }).notNull(),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("active"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  ...taxonomyTimestamps,
}, (table) => ({ uniquePresetVersion: uniqueIndex("taxonomy_presets_key_version_uidx").on(table.presetKey, table.version) }));

const taxonomyPresetValues = pgTable("taxonomy_preset_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  presetId: uuid("preset_id").notNull().references(() => taxonomyPresets.id, { onDelete: "cascade" }),
  dimensionKey: varchar("dimension_key", { length: 100 }).notNull(),
  stableKey: varchar("stable_key", { length: 120 }).notNull(),
  displayName: varchar("display_name", { length: 180 }).notNull(),
  parentStableKey: varchar("parent_stable_key", { length: 120 }),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
}, (table) => ({ uniquePresetDimensionStable: uniqueIndex("taxonomy_preset_values_preset_dim_stable_uidx").on(table.presetId, table.dimensionKey, table.stableKey) }));

module.exports = { taxonomyDimensionDefinitions, taxonomyDimensionCapabilities, organizationDimensionValues, organizationTaxonomyState, taxonomyPresets, taxonomyPresetValues };
