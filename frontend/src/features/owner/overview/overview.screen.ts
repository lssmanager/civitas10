import { routeCatalog } from "../../../navigation/route-catalog";
import { defineScreen } from "../../../authorization/registry/define-screen";

export const ownerOverviewScreen = defineScreen({
  screenId: "owner-overview",
  capability: "owner",
  route: routeCatalog.ownerOverview,
  navigation: { menuKey: "owner.overview", labelKey: "navigation.owner.overview", breadcrumbKey: "breadcrumbs.owner.overview", iconKey: "overview", responsiveGroup: "owner", order: 10 },
  access: { requiredAllPermissions: ["owner.read"], requiresOrganizationContext: false },
  organizationCustomization: { visibility: "locked", order: "locked" },
  actions: [],
});
