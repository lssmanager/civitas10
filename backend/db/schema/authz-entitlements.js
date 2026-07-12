"use strict";
const { sql } = require("drizzle-orm");
const { pgTable, uuid, varchar, text, boolean, timestamp, bigint, uniqueIndex, index } = require("drizzle-orm/pg-core");

const entitlementTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const orgRoleEntitlementLimits = pgTable("org_role_entitlement_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).notNull(),
  logtoRoleId: varchar("logto_role_id", { length: 128 }).notNull(),
  roleNameCache: varchar("role_name_cache", { length: 160 }),
  permissionKey: varchar("permission_key", { length: 180 }).notNull(),
  allowed: boolean("allowed").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  policyVersion: bigint("policy_version", { mode: "number" }).notNull(),
  setByLogtoUserId: varchar("set_by_logto_user_id", { length: 128 }).notNull(),
  reason: text("reason"),
  ...entitlementTimestamps,
}, (table) => ({
  uniqueOrgRolePermission: uniqueIndex("org_role_entitlement_limits_org_role_perm_uidx").on(table.logtoOrganizationId, table.logtoRoleId, table.permissionKey),
  compositeFkTarget: uniqueIndex("org_role_entitlement_limits_id_org_role_perm_uidx").on(table.id, table.logtoOrganizationId, table.logtoRoleId, table.permissionKey),
  orgRoleIdx: index("org_role_entitlement_limits_org_role_idx").on(table.logtoOrganizationId, table.logtoRoleId),
  orgPermissionIdx: index("org_role_entitlement_limits_org_perm_idx").on(table.logtoOrganizationId, table.permissionKey),
  allowedIdx: index("org_role_entitlement_limits_allowed_idx").on(table.allowed),
  policyVersionIdx: index("org_role_entitlement_limits_policy_version_idx").on(table.policyVersion),
}));

const orgRolePermissionActivations = pgTable("org_role_permission_activations", {
  id: uuid("id").primaryKey().defaultRandom(),
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).notNull(),
  logtoRoleId: varchar("logto_role_id", { length: 128 }).notNull(),
  roleNameCache: varchar("role_name_cache", { length: 160 }),
  permissionKey: varchar("permission_key", { length: 180 }).notNull(),
  entitlementLimitId: uuid("entitlement_limit_id").notNull().references(() => orgRoleEntitlementLimits.id, { onDelete: "restrict" }),
  enabled: boolean("enabled").notNull().default(false),
  policyVersion: bigint("policy_version", { mode: "number" }).notNull(),
  setByLogtoUserId: varchar("set_by_logto_user_id", { length: 128 }).notNull(),
  reason: text("reason"),
  ...entitlementTimestamps,
}, (table) => ({
  uniqueOrgRolePermission: uniqueIndex("org_role_permission_activations_org_role_perm_uidx").on(table.logtoOrganizationId, table.logtoRoleId, table.permissionKey),
  orgRoleIdx: index("org_role_permission_activations_org_role_idx").on(table.logtoOrganizationId, table.logtoRoleId),
  orgPermissionIdx: index("org_role_permission_activations_org_perm_idx").on(table.logtoOrganizationId, table.permissionKey),
  enabledIdx: index("org_role_permission_activations_enabled_idx").on(table.enabled),
  policyVersionIdx: index("org_role_permission_activations_policy_version_idx").on(table.policyVersion),
}));

const authorizationPolicyVersions = pgTable("authorization_policy_versions", {
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).primaryKey(),
  version: bigint("version", { mode: "number" }).notNull().default(sql`1`),
  catalogVersion: varchar("catalog_version", { length: 80 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedByLogtoUserId: varchar("updated_by_logto_user_id", { length: 128 }),
  reason: text("reason"),
});

module.exports = { orgRoleEntitlementLimits, orgRolePermissionActivations, authorizationPolicyVersions };
