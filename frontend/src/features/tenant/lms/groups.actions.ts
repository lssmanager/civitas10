import { defineActions } from "../../../authorization/registry/define-actions";

export const lmsGroupsActions = defineActions([
  { actionId: "lms.groups.load", capability: "lms", access: { requiredAllPermissions: ["lms.groups.read"], policies: ["same-organization"], requiresDataScope: true }, presentation: { labelKey: "actions.lms.groups.load", responsivePlacement: "primary" } },
  { actionId: "lms.group_members.load", capability: "lms", access: { requiredAllPermissions: ["lms.group_members.read"], policies: ["same-organization"], requiresDataScope: true }, presentation: { labelKey: "actions.lms.groupMembers.load", responsivePlacement: "secondary" } },
]);
