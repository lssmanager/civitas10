import type { CapabilityKey, FeatureFlagKey, IconKey, PermissionKey, PolicyKey } from "../contracts/ids";

export const activePermissions = new Set<PermissionKey>(["owner.read", "owner.write", "owner.organizations.read", "owner.organizations.create", "owner.system.read", "account.profile.read", "lms.grades.read", "lms.grades.manage", "lms.groups.read", "lms.group_members.read", "lms.course_offerings.read", "analytics.reports.read", "governance.owner.read", "governance.tenant.read", "governance.preview.read"].map((item) => item as PermissionKey));
export const knownPolicies = new Set<PolicyKey>(["same-organization", "membership-required", "authorization-snapshot-current", "resource-belongs-to-organization"].map((item) => item as PolicyKey));
export const knownFeatureFlags = new Set<FeatureFlagKey>(["lms-grades", "lms-groups", "owner-runtime"].map((item) => item as FeatureFlagKey));
export const knownCapabilities = new Set<CapabilityKey>(["lms", "crm", "support", "scheduling", "payments", "email", "storage", "analytics", "notifications", "automation", "community", "owner", "account"]);
export const knownIcons = new Set<IconKey>(["overview", "governance", "operations", "organizations", "directory", "create", "settings", "profile", "grades", "groups"]);
