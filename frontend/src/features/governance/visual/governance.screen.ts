import { defineScreen } from "../../../authorization/registry/define-screen";
import { routeCatalog } from "../../../navigation/route-catalog";

export const ownerGovernanceScreen = defineScreen({
  screenId: "owner-organization-governance",
  capability: "owner",
  route: routeCatalog.ownerOrganizationGovernance,
  navigation: { menuKey: "owner.organizations.governance", parentMenuKey: "owner.organizations", labelKey: "navigation.owner.organizations.governance", breadcrumbKey: "breadcrumbs.owner.organizations.governance", iconKey: "governance", responsiveGroup: "governance", order: 20 },
  access: { requiredAllPermissions: ["governance.owner.read"], policies: ["authorization-snapshot-current"], requiresOrganizationContext: true },
  organizationCustomization: { visibility: "locked", order: "locked" },
  actions: ["governance.access.preview"],
});

export const tenantGovernanceScreen = defineScreen({
  screenId: "tenant-governance",
  capability: "owner",
  route: routeCatalog.tenantGovernance,
  navigation: { menuKey: "tenant.governance", labelKey: "navigation.tenant.governance", breadcrumbKey: "breadcrumbs.tenant.governance", iconKey: "governance", responsiveGroup: "organizations", order: 20 },
  access: { requiredAllPermissions: ["governance.tenant.read"], policies: ["same-organization", "authorization-snapshot-current"], requiresOrganizationContext: true },
  organizationCustomization: { visibility: "locked", order: "locked" },
  actions: ["governance.access.preview"],
});
