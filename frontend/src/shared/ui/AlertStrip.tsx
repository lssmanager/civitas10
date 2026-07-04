import type { ReactNode } from "react";

type AlertStripVariant = "info" | "success" | "warning" | "danger" | "neutral";

type AlertStripProps = {
  children: ReactNode;
  variant?: AlertStripVariant;
  title?: ReactNode;
  className?: string;
};

export const AlertStrip = ({ children, variant = "info", title, className = "" }: AlertStripProps) => (
  <div className={`civitas-alert civitas-alert-${variant} ${className}`} role={variant === "danger" ? "alert" : "status"}>
    {title ? <div className="civitas-alert-title">{title}</div> : null}
    <div className="civitas-alert-content">{children}</div>
  </div>
);
