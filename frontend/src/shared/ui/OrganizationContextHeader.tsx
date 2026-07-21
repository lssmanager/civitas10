import type { ReactNode } from "react";

export const OrganizationContextHeader = ({
  eyebrow = "Organization",
  organizationName,
  breadcrumb,
  status,
  actions,
  description,
}: {
  eyebrow?: ReactNode;
  organizationName: ReactNode;
  breadcrumb?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  description?: ReactNode;
}) => (
  <header className="civitas-card civitas-entity-header" data-civitas-primitive="organization-context-header">
    <div className="civitas-entity-header-main">
      {breadcrumb ? <nav aria-label="Breadcrumb" className="text-sm text-muted-strong">{breadcrumb}</nav> : null}
      <p className="civitas-eyebrow">{eyebrow}</p>
      <div className="civitas-entity-header-title-row">
        <h1 className="civitas-page-title truncate" title={typeof organizationName === "string" ? organizationName : undefined}>{organizationName}</h1>
        {status ? <div className="civitas-entity-header-status">{status}</div> : null}
      </div>
      {description ? <p className="civitas-page-description">{description}</p> : null}
    </div>
    {actions ? <div className="civitas-action-bar">{actions}</div> : null}
  </header>
);
