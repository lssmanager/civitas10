import type { ReactNode } from "react";

export const FormGrid = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`civitas-form-grid civitas-stack-md ${className}`} data-civitas-form-grid="true">{children}</div>
);
