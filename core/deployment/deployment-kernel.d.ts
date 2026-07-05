export type DeploymentService = "frontend" | "backend" | "worker";
export class DeploymentConfigError extends Error {
  code: string;
  variable: string | null;
  cause: string | null;
  hint: string | null;
  service: string | null;
}
export function validateDeploymentConfig(options: { service: "frontend" | "backend" | "worker"; env?: Record<string, string | undefined>; contract?: unknown }): any;

export function classifyDeploymentVariable(variable: string, service: DeploymentService): "contract" | "platform_metadata" | "forbidden_civitas_drift" | "civitas_outside_service_contract" | "external_runtime";
export const forbiddenCivitasVariables: ReadonlySet<string>;
export const platformMetadataVariablePatterns: readonly RegExp[];
