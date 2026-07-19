import { defineScreen } from "../../../authorization/registry/defineScreen";
import { routeCatalog } from "../../../navigation/routeCatalog";

export const lmsGroupsScreen = defineScreen({ screenId: "lms-groups", capability: "lms", route: routeCatalog.lmsGroups, navigation: { menuKey: "lms.groups", labelKey: "navigation.lms.groups", breadcrumbKey: "breadcrumbs.lms.groups", iconKey: "groups", responsiveGroup: "academics", order: 11 }, access: { requiredAllPermissions: ["lms.groups.read"], policies: ["same-organization"], requiresOrganizationContext: true, requiresDataScope: true }, featureFlag: "lms-groups", organizationCustomization: { visibility: "hideable", order: "customizable" }, actions: ["lms.groups.load", "lms.group_members.load"] });
