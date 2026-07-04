import type { ReactNode } from "react";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import { AlertStrip, ActionBar as SharedActionBar, EmptyState as SharedEmptyState, MetricCard as SharedMetricCard, PageHeader as SharedPageHeader, SectionCard as SharedSectionCard, StatusPill as SharedStatusPill } from "../../shared/ui";

type Tone = "info" | "success" | "warning" | "critical" | "neutral";

export const ownerToneFromSeverity = (severity?: string): Tone => {
  if (severity === "critical" || severity === "error" || severity === "danger") return "critical";
  if (severity === "warning") return "warning";
  if (severity === "success" || severity === "ok" || severity === "healthy" || severity === "live") return "success";
  if (severity === "info") return "info";
  return "neutral";
};

const toneToStatus = (tone: Tone) => {
  if (tone === "success") return "success";
  if (tone === "critical") return "danger";
  if (tone === "warning") return "warning";
  if (tone === "info") return "live";
  return "neutral";
};

export const OwnerBadge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) => (
  <SharedStatusPill status={toneToStatus(tone)} noDot>{children}</SharedStatusPill>
);

export const OwnerShell = ({ children, organizationId }: { children: ReactNode; organizationId?: string }) => (
  <OwnerLayout organizationId={organizationId}>{children}</OwnerLayout>
);

export const StatusBanner = ({ children, tone = "info" }: { children: ReactNode; tone?: Tone }) => (
  <AlertStrip variant={tone === "critical" ? "danger" : tone}>{children}</AlertStrip>
);

export const LoadingState = ({ message = "Loading..." }: { message?: ReactNode }) => <SharedEmptyState message={message} />;
export const ErrorState = ({ message }: { message: ReactNode }) => <AlertStrip variant="danger">{message}</AlertStrip>;

export const ActionBar = SharedActionBar;
export const EmptyState = SharedEmptyState;
export const MetricCard = SharedMetricCard;
export const PageHeader = SharedPageHeader;
export const SectionCard = SharedSectionCard;
export const StatusPill = SharedStatusPill;
export const fieldClassName = "civitas-field";
export const labelClassName = "civitas-form-field-label";
export const secondaryButtonClassName = "civitas-secondary-button";
export const primaryButtonClassName = "civitas-primary-button";
