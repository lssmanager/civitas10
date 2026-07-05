export type DeploymentService = "frontend" | "backend" | "worker";
export function validateDeploymentConfig(args: { service: DeploymentService; env?: Record<string, string | boolean | undefined>; contract?: unknown }): any;

export function classifyDeploymentVariable(variable: string, service: DeploymentService): "contract" | "platform_metadata" | "forbidden_civitas_drift" | "civitas_outside_service_contract" | "external_runtime";
export const forbiddenCivitasVariables: ReadonlySet<string>;
export const platformMetadataVariablePatterns: readonly RegExp[];
