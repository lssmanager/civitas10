import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  body?: "default" | "flush";
  className?: string;
  "data-variant"?: string;
};

export const SectionCard = ({ children, title, description, icon, actions, body = "default", className = "", "data-variant": dataVariant }: SectionCardProps) => (
  <section className={`civitas-card civitas-pad-tight-md ${body === "flush" ? "civitas-card-flush" : ""} ${className}`} data-civitas-section-card="true" data-variant={dataVariant}>
    {title || description || actions ? (
      <header className="civitas-card-header">
        <div className="civitas-cluster">
          {icon ? <span aria-hidden="true">{icon}</span> : null}
          <div>
            {title ? <h2 className="civitas-card-title">{title}</h2> : null}
            {description ? <p className="civitas-card-description">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="civitas-action-bar">{actions}</div> : null}
      </header>
    ) : null}
    <div className={body === "flush" ? "civitas-card-body-flush" : undefined}>{children}</div>
  </section>
);
