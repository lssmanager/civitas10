import type { MetricStripItem } from "../MetricStrip";
import type { RoleSelectorOption } from "../RoleSelector";
import type { PermissionToggleRow } from "../PermissionGroupAccordion";

export const governancePatternFixture = {
  states: ["loading", "empty", "error", "denied", "stale"] as const,
  roles: [
    { canonicalRoleId: "organization_admin", alias: "Administrator", status: "active" },
    { canonicalRoleId: "organization_groupleader", alias: "Director de grupo", status: "active" },
  ] satisfies RoleSelectorOption[],
  permissions: [
    { permissionId: "lms.groups.read", label: "Read groups", checked: true },
    { permissionId: "lms.group_members.read", label: "Read group members", checked: false, reason: "tenant_activation_missing" },
  ] satisfies PermissionToggleRow[],
  metrics: [
    { label: "Active permissions", value: "2/3", detail: "One tenant activation missing" },
    { label: "Scope assignments", value: "8", detail: "Membership-role bound" },
  ] satisfies MetricStripItem[],
};
