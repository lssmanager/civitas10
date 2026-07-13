import { defineActions } from "../../authorization/registry/define-actions";
export const accountActions = defineActions([{ actionId: "account.profile.load", capability: "account", access: { requiredAllPermissions: ["account.profile.read"] }, presentation: { labelKey: "actions.account.profile.load" } }]);
