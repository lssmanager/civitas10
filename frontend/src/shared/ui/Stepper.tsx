import type { CSSProperties, ReactNode } from "react";

type StepperStep = {
  id: string;
  label: ReactNode;
};

type StepperProps = {
  steps: StepperStep[];
  activeStep: number;
  className?: string;
};

const stepState = (index: number, activeStep: number) => {
  if (index < activeStep) return "complete";
  if (index === activeStep) return "active";
  return "pending";
};

export const Stepper = ({ steps, activeStep, className = "" }: StepperProps) => (
  <nav className={`civitas-stepper ${className}`} aria-label="Progress" data-civitas-stepper="true" style={{ "--civitas-stepper-count": steps.length } as CSSProperties}>
    <ol className="civitas-stepper-list">
      {steps.map((step, index) => {
        const state = stepState(index, activeStep);
        return (
          <li key={step.id} className="civitas-stepper-item" data-state={state} aria-current={state === "active" ? "step" : undefined}>
            <span className="civitas-stepper-marker">{index + 1}</span>
            <span className="civitas-stepper-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  </nav>
);
