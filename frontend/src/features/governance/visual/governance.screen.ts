import { defineScreen } from "../../../authorization/registry/define-screen";
import { routeCatalog } from "../../../navigation/route-catalog";

export const ownerGovernanceScreen = defineScreen({
  screenId: "owner-governance",
  capability: "owner",
  route: routeCatalog.ownerOrganizationGovernance,
  navigation: { menuKey: "owner.organizations.governance", parentMenuKey: "owner.organizations", labelKey: "navigation.owner.organizations.governance", breadcrumbKey: "breadcrumbs.owner.organizations.governance", iconKey: "governance", responsiveGroup: "governance", order: 20 },
  access: { requiredAllPermissions: ["owner.runtime.read"], policies: ["authorization-snapshot-current"], requiresOrganizationContext: false },
  organizationCustomization: { visibility: "locked", order: "locked" },
  actions: ["owner.governance.access.preview"],
});

export const tenantGovernanceScreen = defineScreen({
  screenId: "tenant-governance",
  capability: "owner",
  route: routeCatalog.tenantGovernance,
  navigation: { menuKey: "tenant.governance", labelKey: "navigation.tenant.governance", breadcrumbKey: "breadcrumbs.tenant.governance", iconKey: "governance", responsiveGroup: "organizations", order: 20 },
  access: { requiredAllPermissions: ["org.documents.read"], policies: ["same-organization", "authorization-snapshot-current"], requiresOrganizationContext: true },
  organizationCustomization: { visibility: "locked", order: "locked" },
  actions: ["tenant.governance.access.preview"],
});
