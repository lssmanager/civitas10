export type DeploymentService = "api" | "worker" | "frontend";

export interface FrontendDeploymentConfig {
  apiUrl: string;
  logtoEndpoint: string;
  logtoAppId: string;
  logtoResource: string;
}

export function validateDeploymentConfig(input: {
  service: "frontend";
  env: Record<string, unknown>;
}): FrontendDeploymentConfig;
