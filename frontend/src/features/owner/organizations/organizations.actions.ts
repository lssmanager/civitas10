import { defineActions } from "../../../authorization/registry/define-actions";
export const ownerOrganizationActions = defineActions([{ actionId: "owner.organizations.create", capability: "owner", access: { requiredAllPermissions: ["owner.organizations.create"] }, presentation: { labelKey: "actions.owner.organizations.create", responsivePlacement: "primary" } }]);
