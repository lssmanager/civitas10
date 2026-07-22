import { defineActions } from "../../../authorization/registry/define-actions";
export const ownerRuntimeActions = defineActions([{ actionId: "owner.system.refresh", capability: "owner", access: { requiredAllPermissions: ["owner.runtime.operations.execute"] }, presentation: { labelKey: "actions.owner.system.refresh", responsivePlacement: "secondary" } }]);
