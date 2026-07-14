export const OPERATIONAL_ACTIONS = ["retry", "verify_provider", "open_organization", "wait_first_wordpress_login", "manual_retry_required", "human_action_required", "none"] as const;
export const OPERATIONAL_ACTION_CATALOG_VERSION = "2026-06-issue-181-action-catalog-v1" as const;
export const OPERATIONAL_CONTRACT_VERSION = "2026-07-civitas10-owner-capability-surfaces-v1" as const;
export const OPERATIONAL_ACTION_LABELS: Record<(typeof OPERATIONAL_ACTIONS)[number], string> = { retry: "Reintentar operación", verify_provider: "Verificar proveedor", open_organization: "Abrir organización", wait_first_wordpress_login: "Esperar primer login WordPress", manual_retry_required: "Reintento manual requerido", human_action_required: "Acción humana requerida", none: "Sin acción" };
export type OperationalAction = (typeof OPERATIONAL_ACTIONS)[number] | string;
export type FreshnessSource = "live_provider_check" | "worker_runtime" | "local_reconciled" | "persisted_snapshot" | string;
export type OperationalFreshness = { source: FreshnessSource; checkedAt: string | null; staleAfterSeconds: number; isStale: boolean; shouldAutoRefresh: boolean; refreshReason: string | null };
export type OperationalInvalidation = { invalidateOnOperationIds: string[]; invalidateOnStatuses: string[]; invalidatedAt: string | null; lastEventId: string | null };
export type OperationalSeverity = "success" | "info" | "warning" | "critical" | string;
export type OperationalBlock = { status: string; severity: OperationalSeverity; humanMessage: string | null; providerCode: string | null; providerStatus: string | number | null; nextAction: OperationalAction; availableActions: OperationalAction[]; freshness: OperationalFreshness; invalidation: OperationalInvalidation; details?: Record<string, unknown>; runtime?: Record<string, unknown> };
export type OwnerCapabilityState = { capability: string; label: string; configured: boolean; adapter: { key: string; label: string; status: string } | null; health: { status: string; severity: OperationalSeverity; humanMessage: string; checkedAt: string | null }; runtimeState: { source: string; status: string; summary: Record<string, unknown>; legacy?: boolean; metadata?: Record<string, unknown>; replacement?: string }; blockers: Array<{ code: string; severity: OperationalSeverity; message: string }>; nextActions: Array<{ type: string; label?: string; target?: Record<string, unknown> }> };
export type OwnerOperationalSummary = { status: string; severity: OperationalSeverity; humanMessage: string; dominantSource: FreshnessSource | null; nextAction: OperationalAction; availableActions: OperationalAction[] };
export type OwnerOperationalStateResponse = { contractVersion: typeof OPERATIONAL_CONTRACT_VERSION; generatedAt: string; organization: { logtoOrganizationId: string | null; name: string | null; status: string; profileId?: string | null; sourceAnchors?: { logtoOrganizationId: string | null; logtoUserId?: string | null } }; summary: OwnerOperationalSummary; capabilities: OwnerCapabilityState[]; blockers: OwnerCapabilityState["blockers"]; nextActions: OwnerCapabilityState["nextActions"]; worker: OperationalBlock | null; polling: { shouldPoll: boolean; intervalSeconds: number; reason: string; activeOperationIds: string[] }; latestEventIds: Record<string, string | null>; legacy?: { deprecated: boolean; providerBlocks: Partial<Record<"fluentcrm" | "wordpress", OperationalBlock>>; replacement: string }; bootstrap?: Record<string, unknown> };
export type OperationalContractMetadata = { actionCatalogVersion: string; compatibility: { strategy: string; compatibleWith: string[]; breakingChangesRequireNewEndpointOrMajorVersion: boolean; [key: string]: unknown }; extensionPolicy: string; [key: string]: unknown };
export type ConsolidatedOperationalResponse = OwnerOperationalStateResponse;
export type OperationalContractValidation = { ok: true; value: ConsolidatedOperationalResponse } | { ok: false; path: string; version: string | null; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const fail = (path: string, version: string | null, reason: string): OperationalContractValidation => ({ ok: false, path, version, reason });
const hasString = (value: Record<string, unknown>, key: string) => typeof value[key] === "string";
const hasNullableString = (value: Record<string, unknown>, key: string) => value[key] === null || typeof value[key] === "string";
const hasNumber = (value: Record<string, unknown>, key: string) => typeof value[key] === "number" && Number.isFinite(value[key] as number);
const hasBoolean = (value: Record<string, unknown>, key: string) => typeof value[key] === "boolean";

function validateFreshness(value: unknown, path: string, version: string | null): OperationalContractValidation | null {
  if (!isRecord(value)) return fail(path, version, "freshness must be an object");
  if (!hasString(value, "source")) return fail(`${path}.source`, version, "freshness.source must be a string");
  if (!hasNullableString(value, "checkedAt")) return fail(`${path}.checkedAt`, version, "freshness.checkedAt must be a string or null");
  if (!hasNumber(value, "staleAfterSeconds")) return fail(`${path}.staleAfterSeconds`, version, "freshness.staleAfterSeconds must be a number");
  if (!hasBoolean(value, "isStale")) return fail(`${path}.isStale`, version, "freshness.isStale must be a boolean");
  if (!hasBoolean(value, "shouldAutoRefresh")) return fail(`${path}.shouldAutoRefresh`, version, "freshness.shouldAutoRefresh must be a boolean");
  if (!hasNullableString(value, "refreshReason")) return fail(`${path}.refreshReason`, version, "freshness.refreshReason must be a string or null");
  return null;
}

function validateOperationalBlock(value: unknown, path: string, version: string | null): OperationalContractValidation | null {
  if (!isRecord(value)) return fail(path, version, "operational block must be an object");
  for (const key of ["status", "severity"] as const) if (!hasString(value, key)) return fail(`${path}.${key}`, version, `${key} must be a string`);
  for (const key of ["humanMessage", "providerCode"] as const) if (!hasNullableString(value, key)) return fail(`${path}.${key}`, version, `${key} must be a string or null`);
  if (!(value.providerStatus === null || typeof value.providerStatus === "string" || typeof value.providerStatus === "number")) return fail(`${path}.providerStatus`, version, "providerStatus must be a string, number or null");
  if (!hasString(value, "nextAction")) return fail(`${path}.nextAction`, version, "nextAction must be a string");
  if (!Array.isArray(value.availableActions) || !value.availableActions.every((item) => typeof item === "string")) return fail(`${path}.availableActions`, version, "availableActions must be an array of strings");
  const freshness = validateFreshness(value.freshness, `${path}.freshness`, version); if (freshness) return freshness;
  if (!isRecord(value.invalidation)) return fail(`${path}.invalidation`, version, "invalidation must be an object");
  return null;
}

function validateCapability(value: unknown, index: number, version: string | null): OperationalContractValidation | null {
  const path = `$.capabilities[${index}]`;
  if (!isRecord(value)) return fail(path, version, "capability must be an object");
  for (const key of ["capability", "label"] as const) if (!hasString(value, key)) return fail(`${path}.${key}`, version, `${key} must be a string`);
  if (!hasBoolean(value, "configured")) return fail(`${path}.configured`, version, "configured must be a boolean");
  if (!(value.adapter === null || isRecord(value.adapter))) return fail(`${path}.adapter`, version, "adapter must be an object or null");
  if (!isRecord(value.health)) return fail(`${path}.health`, version, "health must be an object");
  for (const key of ["status", "severity", "humanMessage"] as const) if (!hasString(value.health, key)) return fail(`${path}.health.${key}`, version, `health.${key} must be a string`);
  if (!hasNullableString(value.health, "checkedAt")) return fail(`${path}.health.checkedAt`, version, "health.checkedAt must be a string or null");
  if (!isRecord(value.runtimeState)) return fail(`${path}.runtimeState`, version, "runtimeState must be a non-null object");
  for (const key of ["source", "status"] as const) if (!hasString(value.runtimeState, key)) return fail(`${path}.runtimeState.${key}`, version, `runtimeState.${key} must be a string`);
  if (!isRecord(value.runtimeState.summary)) return fail(`${path}.runtimeState.summary`, version, "runtimeState.summary must be an object");
  if (!Array.isArray(value.blockers)) return fail(`${path}.blockers`, version, "blockers must be an array");
  if (!Array.isArray(value.nextActions)) return fail(`${path}.nextActions`, version, "nextActions must be an array");
  return null;
}

export const validateOperationalResponse = (value: unknown): OperationalContractValidation => {
  const version = isRecord(value) && typeof value.contractVersion === "string" ? value.contractVersion : null;
  if (!isRecord(value)) return fail("$", version, "response must be an object");
  if (value.contractVersion !== OPERATIONAL_CONTRACT_VERSION) return fail("$.contractVersion", version, `unsupported contract version; expected ${OPERATIONAL_CONTRACT_VERSION}`);
  if (!hasString(value, "generatedAt")) return fail("$.generatedAt", version, "generatedAt must be a string");
  if (!isRecord(value.organization)) return fail("$.organization", version, "organization must be an object");
  if (!isRecord(value.summary)) return fail("$.summary", version, "summary must be a non-null object");
  for (const key of ["status", "severity", "humanMessage", "nextAction"] as const) if (!hasString(value.summary, key)) return fail(`$.summary.${key}`, version, `summary.${key} must be a string`);
  if (!Array.isArray(value.summary.availableActions)) return fail("$.summary.availableActions", version, "summary.availableActions must be an array");
  if (!Array.isArray(value.capabilities)) return fail("$.capabilities", version, "capabilities must be an array");
  for (let index = 0; index < value.capabilities.length; index += 1) { const result = validateCapability(value.capabilities[index], index, version); if (result) return result; }
  if (value.worker !== null) { const worker = validateOperationalBlock(value.worker, "$.worker", version); if (worker) return worker; }
  if (!isRecord(value.polling)) return fail("$.polling", version, "polling must be a non-null object");
  if (!hasBoolean(value.polling, "shouldPoll")) return fail("$.polling.shouldPoll", version, "polling.shouldPoll must be a boolean");
  if (!hasNumber(value.polling, "intervalSeconds")) return fail("$.polling.intervalSeconds", version, "polling.intervalSeconds must be a number");
  if (!hasString(value.polling, "reason")) return fail("$.polling.reason", version, "polling.reason must be a string");
  if (!Array.isArray(value.polling.activeOperationIds)) return fail("$.polling.activeOperationIds", version, "polling.activeOperationIds must be an array");
  if (!isRecord(value.latestEventIds)) return fail("$.latestEventIds", version, "latestEventIds must be an object");
  return { ok: true, value: value as ConsolidatedOperationalResponse };
};
export const dominanceRank = (source?: FreshnessSource, active?: boolean): number => source === "worker_runtime" && active ? 400 : source === "live_provider_check" ? 300 : source === "local_reconciled" ? 200 : source === "persisted_snapshot" ? 100 : 0;
export const shouldPreferOperationalBlock = (candidate: OperationalBlock, current?: OperationalBlock): boolean => dominanceRank(candidate.freshness.source, Boolean(candidate.runtime?.isActive)) > dominanceRank(current?.freshness.source, Boolean(current?.runtime?.isActive));
