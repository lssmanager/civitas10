import { defineActions } from "../../../authorization/registry/define-actions";

export const governanceActions = defineActions([
  { actionId: "governance.access.preview", capability: "owner", access: { requiredAllPermissions: ["governance.preview.read"], policies: ["authorization-snapshot-current"] }, presentation: { labelKey: "actions.governance.accessPreview", responsivePlacement: "secondary" } },
]);
