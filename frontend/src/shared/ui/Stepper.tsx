import type { CSSProperties, ReactNode } from "react";
import { useBreakpoint } from "../hooks";

type StepperStep = {
  id: string;
  label: ReactNode;
};

type StepperProps = {
  steps: StepperStep[];
  activeStep: number;
  className?: string;
};

type StepperState = "complete" | "active" | "pending";

const stepState = (index: number, activeStep: number): StepperState => {
  if (index < activeStep) return "complete";
  if (index === activeStep) return "active";
  return "pending";
};

export const Stepper = ({ steps, activeStep, className = "" }: StepperProps) => {
  const isCompact = useBreakpoint("md");
  const activeIndex = Math.min(Math.max(activeStep, 0), Math.max(steps.length - 1, 0));
  const activeLabel = steps[activeIndex]?.label;
  const listClassName = `civitas-stepper-list ${isCompact ? "civitas-scroll-x civitas-nowrap-children" : ""}`;

  return (
    <nav className={`civitas-stepper ${className}`} aria-label="Progress" data-civitas-stepper="true" style={{ "--civitas-stepper-count": steps.length } as CSSProperties}>
      {isCompact ? <p className="civitas-stepper-current">Step {activeIndex + 1} of {steps.length} — {activeLabel}</p> : null}
      <ol className={listClassName}>
        {steps.map((step, index) => {
          const state = stepState(index, activeIndex);
          return (
            <li key={step.id} className="civitas-stepper-item" data-state={state} aria-current={state === "active" ? "step" : undefined}>
              <span className="civitas-stepper-marker" aria-hidden="true">{state === "complete" ? "✓" : index + 1}</span>
              <span className={`civitas-stepper-label ${isCompact ? "civitas-visually-hidden" : ""}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
