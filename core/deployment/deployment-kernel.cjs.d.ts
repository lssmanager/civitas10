export type DeploymentService = "frontend" | "backend" | "worker";
export function validateDeploymentConfig(args: { service: DeploymentService; env?: Record<string, string | boolean | undefined>; contract?: unknown }): any;
