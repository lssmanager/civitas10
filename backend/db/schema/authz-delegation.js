"use strict";

const { sql } = require("drizzle-orm");
const { pgTable, uuid, varchar, text, timestamp, boolean, uniqueIndex, index, check } = require("drizzle-orm/pg-core");

const delegationTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const roleDelegationRules = pgTable("role_delegation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  grantorLogtoRoleId: varchar("grantor_logto_role_id", { length: 128 }).notNull(),
  grantorRoleNameCache: varchar("grantor_role_name_cache", { length: 160 }),
  targetLogtoRoleId: varchar("target_logto_role_id", { length: 128 }).notNull(),
  targetRoleNameCache: varchar("target_role_name_cache", { length: 160 }),
  canAssign: boolean("can_assign").notNull().default(false),
  canRevoke: boolean("can_revoke").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  updatedByLogtoUserId: varchar("updated_by_logto_user_id", { length: 128 }).notNull(),
  reason: text("reason"),
  ...delegationTimestamps,
}, (table) => ({
  uniqueGrantorTarget: uniqueIndex("role_delegation_rules_grantor_target_uidx").on(table.grantorLogtoRoleId, table.targetLogtoRoleId),
  grantorActiveIdx: index("role_delegation_rules_grantor_active_idx").on(table.grantorLogtoRoleId, table.isActive),
  targetActiveIdx: index("role_delegation_rules_target_active_idx").on(table.targetLogtoRoleId, table.isActive),
  noSelfDelegation: check("role_delegation_rules_no_self_chk", sql`${table.grantorLogtoRoleId} <> ${table.targetLogtoRoleId}`),
}));

const orgDelegationRestrictions = pgTable("org_delegation_restrictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  logtoOrganizationId: varchar("logto_organization_id", { length: 128 }).notNull(),
  grantorLogtoRoleId: varchar("grantor_logto_role_id", { length: 128 }).notNull(),
  targetLogtoRoleId: varchar("target_logto_role_id", { length: 128 }).notNull(),
  assignDisabled: boolean("assign_disabled").notNull().default(false),
  revokeDisabled: boolean("revoke_disabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  updatedByLogtoUserId: varchar("updated_by_logto_user_id", { length: 128 }).notNull(),
  reason: text("reason"),
  ...delegationTimestamps,
}, (table) => ({
  uniqueOrgGrantorTarget: uniqueIndex("org_delegation_restrictions_org_grantor_target_uidx").on(table.logtoOrganizationId, table.grantorLogtoRoleId, table.targetLogtoRoleId),
  orgGrantorIdx: index("org_delegation_restrictions_org_grantor_idx").on(table.logtoOrganizationId, table.grantorLogtoRoleId),
  orgTargetIdx: index("org_delegation_restrictions_org_target_idx").on(table.logtoOrganizationId, table.targetLogtoRoleId),
  activeIdx: index("org_delegation_restrictions_active_idx").on(table.isActive),
  noSelfDelegation: check("org_delegation_restrictions_no_self_chk", sql`${table.grantorLogtoRoleId} <> ${table.targetLogtoRoleId}`),
}));

module.exports = { roleDelegationRules, orgDelegationRestrictions };
