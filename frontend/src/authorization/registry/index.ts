import { accountActions } from "../../features/account/account.actions";
import { accountScreen } from "../../features/account/account.screen";
import { ownerOrganizationActions } from "../../features/owner/organizations/organizations.actions";
import { ownerCreateOrganizationScreen, ownerOrganizationsScreen, ownerOrganizationStateScreen } from "../../features/owner/organizations/organizations.screen";
import { ownerOverviewScreen } from "../../features/owner/overview/overview.screen";
import { ownerRuntimeActions } from "../../features/owner/runtime/runtime.actions";
import { ownerWorkerQueuesScreen } from "../../features/owner/runtime/runtime.screen";
import { lmsGradesActions } from "../../features/tenant/lms/grades.actions";
import { lmsGradesScreen } from "../../features/tenant/lms/grades.screen";
import { lmsGroupsActions } from "../../features/tenant/lms/groups.actions";
import { lmsGroupsScreen } from "../../features/tenant/lms/groups.screen";
import { governanceActions } from "../../features/governance/visual/governance.actions";
import { ownerGovernanceScreen, tenantGovernanceScreen } from "../../features/governance/visual/governance.screen";
import { compileVisualRegistry } from "./compile-visual-registry";

export const visualRegistry = compileVisualRegistry({
  screens: [ownerOverviewScreen, ownerOrganizationsScreen, ownerCreateOrganizationScreen, ownerOrganizationStateScreen, ownerGovernanceScreen, ownerWorkerQueuesScreen, accountScreen, tenantGovernanceScreen, lmsGradesScreen, lmsGroupsScreen],
  actions: [...ownerOrganizationActions, ...ownerRuntimeActions, ...accountActions, ...governanceActions, ...lmsGradesActions, ...lmsGroupsActions],
});

export type { VisualRegistry } from "./compile-visual-registry";
export { compileVisualRegistry } from "./compile-visual-registry";
export { validateVisualRegistry } from "./validate-visual-registry";
