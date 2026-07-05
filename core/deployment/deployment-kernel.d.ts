export class DeploymentConfigError extends Error {
  code: string;
  variable: string | null;
  cause: string | null;
  hint: string | null;
  service: string | null;
}
export function validateDeploymentConfig(options: { service: "frontend" | "backend" | "worker"; env?: Record<string, string | undefined>; contract?: unknown }): any;
