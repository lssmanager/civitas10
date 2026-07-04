import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
};

export const FormField = ({ id, label, children, hint, error, required = false, className = "" }: FormFieldProps) => (
  <div className={`civitas-form-field ${className}`} data-civitas-form-field="true">
    <label className="civitas-form-field-label" htmlFor={id}>
      <span>{label}</span>
      {required ? <span className="civitas-form-field-required" aria-hidden="true">*</span> : null}
    </label>
    {children}
    {hint ? <p className="civitas-form-field-hint">{hint}</p> : null}
    {error ? <p className="civitas-form-field-error">{error}</p> : null}
  </div>
);
