import type { ReactNode } from "react";
import { OrganizationContextHeader } from "../OrganizationContextHeader";

export const EntityWorkspace = ({ organizationName, breadcrumb, status, actions, children }: { organizationName: ReactNode; breadcrumb?: ReactNode; status?: ReactNode; actions?: ReactNode; children: ReactNode }) => (
  <div className="civitas-workspace-stack" data-civitas-pattern="entity-workspace">
    <OrganizationContextHeader organizationName={organizationName} breadcrumb={breadcrumb} status={status} actions={actions} />
    {children}
  </div>
);
