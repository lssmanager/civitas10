import { useMemo } from "react";
import { useApi } from "../../../api/base";
import type { LmsGroupDetail, LmsGroupSummary } from "./groups/LmsGroupsModule";

function assertGroups(value: unknown): { groups: LmsGroupSummary[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { groups?: unknown }).groups)) throw new Error("LMS groups contract failed: groups must be an array");
  return value as { groups: LmsGroupSummary[] };
}
function assertGroupDetail(value: unknown): { group: LmsGroupDetail } {
  if (!value || typeof value !== "object" || typeof (value as { group?: unknown }).group !== "object") throw new Error("LMS group detail contract failed: group is required");
  return value as { group: LmsGroupDetail };
}

export const useLmsGroupsApi = () => {
  const { organizationApiFetch } = useApi();
  return useMemo(() => ({
    listGroups: async (organizationId: string) => assertGroups(await organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/lms/groups`)),
    getGroup: async (organizationId: string, groupId: string) => assertGroupDetail(await organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/lms/groups/${encodeURIComponent(groupId)}`)),
    getGroupMembers: async (organizationId: string, groupId: string) => organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/lms/groups/${encodeURIComponent(groupId)}/members`),
  }), [organizationApiFetch]);
};
