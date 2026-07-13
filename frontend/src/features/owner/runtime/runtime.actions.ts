import { defineActions } from "../../../authorization/registry/define-actions";
export const ownerRuntimeActions = defineActions([{ actionId: "owner.system.refresh", capability: "owner", access: { requiredAllPermissions: ["owner.system.read"] }, presentation: { labelKey: "actions.owner.system.refresh", responsivePlacement: "secondary" } }]);
