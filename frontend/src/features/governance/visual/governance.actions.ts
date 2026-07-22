import { defineActions } from "../../../authorization/registry/define-actions";

export const governanceActions = defineActions([
  { actionId: "owner.governance.access.preview", capability: "owner", access: { requiredAllPermissions: ["owner.runtime.operations.execute"], policies: ["authorization-snapshot-current"] }, presentation: { labelKey: "actions.governance.accessPreview", responsivePlacement: "secondary" } },
  { actionId: "tenant.governance.access.preview", capability: "owner", access: { requiredAllPermissions: ["org.documents.read"], policies: ["same-organization", "authorization-snapshot-current"] }, presentation: { labelKey: "actions.governance.accessPreview", responsivePlacement: "secondary" } },
]);
