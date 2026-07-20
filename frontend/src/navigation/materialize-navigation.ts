import type { NavigationNode } from "./routes";
import { appRoutes, ownerNavigationTree } from "./routes";
import { flattenGovernanceWorkspaceItems } from "../features/governance/governance-workspace-contract";
import { isConcreteRouteParam } from "./route-builders";

export const materializeNavigationTree = (items: readonly NavigationNode[], params: Record<string, string | undefined> = {}): NavigationNode[] => items.flatMap((item) => {
  let path = item.path;
  if (item.build) {
    try {
      path = item.build(params as Record<string, string>);
    } catch {
      return [];
    }
  }
  return [{ ...item, path, children: item.children ? materializeNavigationTree(item.children, params) : undefined }];
});


export type OwnerNavigationTreeInput = {
  organizationId?: string;
  organizationName?: string | null;
};

export const buildOwnerNavigationTree = ({ organizationId, organizationName }: OwnerNavigationTreeInput = {}): NavigationNode[] => {
  const baseTree = ownerNavigationTree.map((item) => ({ ...item, children: item.children ? [...item.children] : undefined }));
  if (!isConcreteRouteParam(organizationId)) return baseTree;

  const governanceChildren = flattenGovernanceWorkspaceItems()
    .filter((item) => item.moduleKey !== "organization-overview" && item.moduleKey !== "operations" && item.status === "active")
    .map((item) => appRoutes[item.routeKey]);

  const workspaceLabel = organizationName?.trim() || "Selected organization";
  return [
    ...baseTree,
    {
      path: `/owner/organizations/${encodeURIComponent(organizationId)}/workspace`,
      label: workspaceLabel,
      iconKey: "organizations",
      structural: true,
      children: [
        appRoutes.ownerOrganizationState,
        { ...appRoutes.ownerOrganizationGovernance, children: governanceChildren },
        appRoutes.ownerOrganizationOperations,
      ],
    },
  ];
};
